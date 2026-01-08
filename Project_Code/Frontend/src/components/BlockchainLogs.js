import { useEffect, useState } from "react";
import { getBlockchainLogs } from "../services/blockchainApi";

export default function BlockchainLogs() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    getBlockchainLogs().then(setLogs);
  }, []);

  return (
    <div className="card">
      <h3>Blockchain Event Logs</h3>

      <table border="1" width="100%">
        <thead>
          <tr>
            <th>Event</th>
            <th>Intersection</th>
            <th>Sender</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, i) => (
            <tr key={i}>
              <td>{log.event}</td>
              <td>{log.intersection}</td>
              <td>{log.sender}</td>
              <td>{new Date(log.timestamp * 1000).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
