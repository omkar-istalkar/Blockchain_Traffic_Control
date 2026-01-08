from web3 import Web3
import json
import os

# Connect to Ganache CLI
w3 = Web3(Web3.HTTPProvider("http://127.0.0.1:7545"))

assert w3.is_connected(), "Blockchain not connected"

# Load contract ABI + address
BASE_DIR = os.path.dirname(__file__)
with open(os.path.join(BASE_DIR, "contract.json")) as f:
    contract_data = json.load(f)

contract = w3.eth.contract(
    address=contract_data["address"],
    abi=contract_data["abi"]
)

# Active traffic signal (node)
ACTIVE_NODE = 0   # default signal

# -----------------------------
# Node-related functions
# -----------------------------

def get_all_nodes():
    nodes = []
    for i, acc in enumerate(w3.eth.accounts):
        nodes.append({
            "nodeId": i,
            "address": acc,
            "balance": w3.from_wei(w3.eth.get_balance(acc), "ether")
        })
    return nodes


def set_active_node(node_id):
    global ACTIVE_NODE
    ACTIVE_NODE = node_id


def get_active_node():
    acc = w3.eth.accounts[ACTIVE_NODE]
    return {
        "nodeId": ACTIVE_NODE,
        "address": acc,
        "balance": w3.from_wei(w3.eth.get_balance(acc), "ether")
    }

# -----------------------------
# Blockchain log functions
# -----------------------------

def add_log(event_type, intersection):
    sender = w3.eth.accounts[ACTIVE_NODE]

    tx_hash = contract.functions.addLog(
        event_type,
        intersection
    ).transact({"from": sender})

    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    return receipt.transactionHash.hex()


def get_all_logs():
    logs = []
    count = contract.functions.getLogsCount().call()

    for i in range(count):
        log = contract.functions.getLog(i).call()
        logs.append({
            "event": log[0],
            "intersection": log[1],
            "sender": log[2],
            "timestamp": log[3]
        })
    return logs
