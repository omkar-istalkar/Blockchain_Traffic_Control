const BASE_URL = "http://127.0.0.1:8000/signals"; // your backend API

export async function fetchSignal() {
  const res = await fetch(`${BASE_URL}/current`);
  return res.json();
}

