import os
import time
import traci
from web3 import Web3
import json
from dotenv import load_dotenv

# ===========================
# Load environment variables
# ===========================
load_dotenv()

RPC_URL = os.getenv("RPC_URL", "http://127.0.0.1:8545")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
ACCOUNT = os.getenv("ACCOUNT")

# ===========================
# Connect to blockchain
# ===========================
w3 = Web3(Web3.HTTPProvider(RPC_URL))
if not w3.is_connected():
    raise Exception("Could not connect to Ganache blockchain. Is Ganache running?")
print("Connected to Ganache ✅")

# Load contract ABI
abi_path = os.path.join(os.path.dirname(__file__), "../blockchain/build/contracts/TrafficLog.json")
with open(abi_path) as f:
    contract_json = json.load(f)
    abi = contract_json["abi"]

contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=abi)

# ===========================
# SUMO Configuration
# ===========================
SUMO_CONFIG = ["sumo", "-c", "network1.sumocfg"]  # replace with your SUMO config
SIMULATION_STEPS = 500
LOG_INTERVAL = 50  # steps to log to blockchain

# ===========================
# Simulation Loop
# ===========================
def run_simulation():
    traci.start(SUMO_CONFIG)
    print("SUMO started ✅")

    edge_ids = ["E9"]  # List of edges you want to track

    for step in range(SIMULATION_STEPS):
        traci.simulationStep()

        for edge in edge_ids:
            vehicle_count = traci.edge.getLastStepVehicleNumber(edge)
            print(f"Step {step}: Vehicles on {edge} = {vehicle_count}")

            # Log to blockchain at intervals
            if step % LOG_INTERVAL == 0:
                try:
                    tx = contract.functions.addRecord(edge, vehicle_count).build_transaction({
                        'from': ACCOUNT,
                        'gas': 2000000,
                        'nonce': w3.eth.getTransactionCount(ACCOUNT)
                    })
                    signed_tx = w3.eth.account.sign_transaction(tx, PRIVATE_KEY)
                    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
                    w3.eth.wait_for_transaction_receipt(tx_hash)
                    print(f"Logged to blockchain ✅ Step {step}, {edge} count: {vehicle_count}, Tx: {tx_hash.hex()}")
                except Exception as e:
                    print("Blockchain logging error:", e)

    traci.close()
    print("SUMO simulation ended ✅")
