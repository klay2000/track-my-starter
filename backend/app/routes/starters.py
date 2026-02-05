from fastapi import APIRouter, HTTPException
from datetime import datetime
from bson import ObjectId

from app.database import get_db
from app.models import (
    StarterCreate,
    StarterResponse,
    StarterMapItem,
    TreeNode,
    TreeResponse,
    Location,
)
from app.services.words import generate_word_id, parse_words_param

router = APIRouter(prefix="/api/starters", tags=["starters"])

MAX_TREE_NODES = 100


@router.get("", response_model=list[StarterMapItem])
async def list_starters():
    db = get_db()
    starters = await db.starters.find(
        {}, {"words": 1, "name": 1, "starter_type": 1, "location": 1}
    ).to_list(10000)

    return [
        StarterMapItem(
            words=s["words"],
            name=s.get("name"),
            starter_type=s["starter_type"],
            location=Location(**s["location"]),
        )
        for s in starters
    ]


@router.get("/{words_param}", response_model=StarterResponse)
async def get_starter(words_param: str):
    words = parse_words_param(words_param)
    if not words:
        raise HTTPException(status_code=400, detail="Invalid word identifier")

    db = get_db()
    starter = await db.starters.find_one({"words": words})

    if not starter:
        raise HTTPException(status_code=404, detail="Starter not found")

    parent_words = None
    if starter.get("parent_id"):
        parent = await db.starters.find_one({"_id": ObjectId(starter["parent_id"])})
        if parent:
            parent_words = parent["words"]

    return StarterResponse(
        words=starter["words"],
        name=starter.get("name"),
        starter_type=starter["starter_type"],
        type_other=starter.get("type_other"),
        location=Location(**starter["location"]),
        parent_words=parent_words,
        created_at=starter["created_at"],
    )


@router.get("/{words_param}/tree", response_model=TreeResponse)
async def get_starter_tree(words_param: str):
    words = parse_words_param(words_param)
    if not words:
        raise HTTPException(status_code=400, detail="Invalid word identifier")

    db = get_db()
    starter = await db.starters.find_one({"words": words})

    if not starter:
        raise HTTPException(status_code=404, detail="Starter not found")

    nodes_dict = {}  # id -> node data
    edges = []
    truncated = False

    def add_node(doc, is_target=False):
        node_id = str(doc["_id"])
        if node_id not in nodes_dict:
            nodes_dict[node_id] = {
                "words": doc["words"],
                "name": doc.get("name"),
                "starter_type": doc["starter_type"],
                "is_target": is_target,
                "location": doc["location"],
                "_id": node_id,
            }
            return True
        return False

    def add_edge(from_words, to_words):
        edge = {
            "from": "-".join(from_words),
            "to": "-".join(to_words),
        }
        # Avoid duplicate edges
        if edge not in edges:
            edges.append(edge)

    # Add the target node first
    add_node(starter, is_target=True)

    # Get all ancestors
    current = starter
    while current.get("parent_id") and len(nodes_dict) < MAX_TREE_NODES:
        try:
            parent = await db.starters.find_one({"_id": ObjectId(current["parent_id"])})
            if not parent:
                break
            add_node(parent)
            add_edge(parent["words"], current["words"])
            current = parent
        except Exception:
            break

    if len(nodes_dict) >= MAX_TREE_NODES:
        truncated = True

    # Get all descendants using BFS
    async def get_all_descendants(root_doc):
        nonlocal truncated
        queue = [root_doc]

        while queue and len(nodes_dict) < MAX_TREE_NODES:
            current_doc = queue.pop(0)
            children = await db.starters.find(
                {"parent_id": str(current_doc["_id"])}
            ).to_list(100)

            for child in children:
                if len(nodes_dict) >= MAX_TREE_NODES:
                    truncated = True
                    break
                add_node(child)
                add_edge(current_doc["words"], child["words"])
                queue.append(child)

    await get_all_descendants(starter)

    # Convert nodes_dict to list
    nodes = [
        TreeNode(
            words=n["words"],
            name=n["name"],
            starter_type=n["starter_type"],
            is_target=n["is_target"],
            location=Location(**n["location"]),
        )
        for n in nodes_dict.values()
    ]

    return TreeResponse(nodes=nodes, edges=edges, truncated=truncated)


@router.post("", response_model=StarterResponse)
async def create_starter(data: StarterCreate):
    db = get_db()

    words = generate_word_id()
    while await db.starters.find_one({"words": words}):
        words = generate_word_id()

    doc = {
        "words": words,
        "name": data.name,
        "starter_type": data.starter_type,
        "type_other": data.type_other,
        "location": {"type": "Point", "coordinates": [data.lng, data.lat]},
        "parent_id": None,
        "created_at": datetime.utcnow(),
    }

    await db.starters.insert_one(doc)

    return StarterResponse(
        words=words,
        name=data.name,
        starter_type=data.starter_type,
        type_other=data.type_other,
        location=Location(**doc["location"]),
        parent_words=None,
        created_at=doc["created_at"],
    )


@router.post("/{words_param}/descendants", response_model=StarterResponse)
async def create_descendant(words_param: str, data: StarterCreate):
    parent_words = parse_words_param(words_param)
    if not parent_words:
        raise HTTPException(status_code=400, detail="Invalid word identifier")

    db = get_db()
    parent = await db.starters.find_one({"words": parent_words})

    if not parent:
        raise HTTPException(status_code=404, detail="Parent starter not found")

    words = generate_word_id(first_word=parent_words[0])
    while await db.starters.find_one({"words": words}):
        words = generate_word_id(first_word=parent_words[0])

    doc = {
        "words": words,
        "name": data.name,
        "starter_type": data.starter_type,
        "type_other": data.type_other,
        "location": {"type": "Point", "coordinates": [data.lng, data.lat]},
        "parent_id": str(parent["_id"]),
        "created_at": datetime.utcnow(),
    }

    await db.starters.insert_one(doc)

    return StarterResponse(
        words=words,
        name=data.name,
        starter_type=data.starter_type,
        type_other=data.type_other,
        location=Location(**doc["location"]),
        parent_words=parent_words,
        created_at=doc["created_at"],
    )
