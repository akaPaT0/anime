async function test() {
  try {
    const res = await fetch("https://api.anify.tv/info/269");
    console.log("INFO status:", res.status);
    if (res.ok) {
      const data = await res.json();
      console.log("INFO keys:", Object.keys(data));
      console.log("INFO mappings:", data.mappings);
    }
  } catch (e) {
    console.error("INFO error:", e.message);
  }

  try {
    const res = await fetch("https://api.anify.tv/episodes/269");
    console.log("EPISODES status:", res.status);
    if (res.ok) {
      const data = await res.json();
      console.log("EPISODES type:", Array.isArray(data) ? "Array" : typeof data);
      console.log("EPISODES sample:", JSON.stringify(data).slice(0, 1000));
    }
  } catch (e) {
    console.error("EPISODES error:", e.message);
  }
}

test();
