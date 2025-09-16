# Code regarding "Blockchain Module" will be placed here

---

# 📂 `blockchain/README.md` (Member 3 – Blockchain)

```markdown
# 🔗 Blockchain Logging (Member 3)

## 🎯 Objective
Store detection and traffic control events securely on **Ethereum blockchain** using smart contracts.

---

## 📌 Tasks
1. Write Solidity smart contract `TrafficLog.sol` to store:  
   `{signalID, vehicleType, action, timestamp}`  
2. Deploy the contract on a local blockchain (Ganache/Truffle).  
3. Write `blockchain_logger.py` (Python + Web3.py) to:  
   - Receive events from traffic controller.  
   - Store them immutably on blockchain.  
   - Provide APIs for querying logs.  

---

## 📥 Input
- Event logs from **Traffic Control module**, format:  
```json
{
  "signalID": "intersection_3",
  "vehicleType": "ambulance",
  "action": "Green Corridor Activated",
  "timestamp": "2025-09-12T12:31:00Z"
}
