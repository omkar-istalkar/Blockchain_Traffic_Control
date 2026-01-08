import os
from dotenv import load_dotenv
from web3 import Web3

load_dotenv()

# Load ENV variables
RPC_URL = os.getenv("RPC_URL", "http://127.0.0.1:7545")  # Ganache default
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")  # optional, if sending transactions
ACCOUNT = os.getenv("ACCOUNT")

# Connect to blockchain
web3 = Web3(Web3.HTTPProvider(RPC_URL))
if web3.is_connected():
    print("✅ Connected to blockchain")
else:
    print("❌ Blockchain connection failed")
