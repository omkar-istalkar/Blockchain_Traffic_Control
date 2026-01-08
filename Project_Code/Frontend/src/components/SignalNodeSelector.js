import { useEffect, useState } from "react";
import {
  getBlockchainNodes,
  selectBlockchainNode,
} from "../services/blockchainApi";

export default function SignalNodeSelector() {
  const [nodes, setNodes] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [activeNode, setActiveNode] = useState(null);

  useEffect(() => {
    getBlockchainNodes().then(setNodes);
  }, []);

  const handleChange = async (e) => {
    const nodeId = parseInt(e.target.value);
    setSelectedNodeId(nodeId);

    const res = await selectBlockchainNode(nodeId);
    setActiveNode(res.activeNode);
  };

  return (
    <div className="card">
      <h3>Blockchain Traffic Signal Nodes</h3>

      {/* 🔽 Dropdown */}
      <select
        value={selectedNodeId}
        onChange={handleChange}
        style={{ width: "100%", padding: "8px", marginTop: "10px" }}
      >
        <option value="">-- Select Traffic Signal --</option>
        {nodes.map((node) => (
          <option key={node.nodeId} value={node.nodeId}>
            Signal {node.nodeId}
          </option>
        ))}
      </select>

      {/* 📌 Active Node Info */}
      {activeNode && (
        <div style={{ marginTop: "20px" }}>
          <h4>Active Signal Node</h4>
          <p><b>ID:</b> {activeNode.nodeId}</p>
          <p><b>Address:</b> {activeNode.address}</p>
          <p><b>Balance:</b> {activeNode.balance} ETH</p>
          <p><b>Status:</b> <span style={{ color: "green" }}>ACTIVE</span></p>
        </div>
      )}
    </div>
  );
}
