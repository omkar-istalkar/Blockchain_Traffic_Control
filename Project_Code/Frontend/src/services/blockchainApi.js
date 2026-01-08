const BASE_URL = "http://127.0.0.1:8000";

export const getBlockchainNodes = async () => {
  const res = await fetch(`${BASE_URL}/blockchain/nodes`);
  return res.json();
};

export const selectBlockchainNode = async (nodeId) => {
  const res = await fetch(`${BASE_URL}/blockchain/select-node`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ nodeId }),
  });
  return res.json();
};

export const getActiveBlockchainNode = async () => {
  const res = await fetch(`${BASE_URL}/blockchain/active-node`);
  return res.json();
};

export const getBlockchainLogs = async () => {
  const res = await fetch(`${BASE_URL}/blockchain/logs`);
  return res.json();
};
