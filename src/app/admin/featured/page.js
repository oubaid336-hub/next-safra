"use client";

import { useEffect, useState } from "react";
import { getApiBaseUrl } from "@/lib/config";

export default function AdminFeaturedPage() {
  const [houses, setHouses] = useState([]);
  const [cars, setCars] = useState([]);
  const [houseChecked, setHouseChecked] = useState({});
  const [carChecked, setCarChecked] = useState({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [msg, setMsg] = useState("");

  const API = getApiBaseUrl();

  async function load() {
    try {
      const [candidatesRes, featuredRes] = await Promise.all([
        fetch(`${API}/api/featured/candidates`),
        fetch(`${API}/api/featured`),
      ]);
      const candidates = await candidatesRes.json();
      const featured = await featuredRes.json();

      const featuredHouseIds = new Set((featured.houses || []).map((h) => h._id));
      const featuredCarId = featured.car ? featured.car._id : null;

      setHouses(candidates.houses || []);
      setCars(candidates.cars || []);

      const hChecked = {};
      (candidates.houses || []).forEach((h) => {
        hChecked[h._id] = featuredHouseIds.has(h._id);
      });
      setHouseChecked(hChecked);

      const cChecked = {};
      (candidates.cars || []).forEach((c) => {
        cChecked[c._id] = c._id === featuredCarId;
      });
      setCarChecked(cChecked);

      setLoading(false);
    } catch (err) {
      setLoadError(true);
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const term = search.trim().toLowerCase();
  const filteredHouses = houses.filter((h) =>
    `${h.title} ${h.location}`.toLowerCase().includes(term)
  );
  const filteredCars = cars.filter((c) =>
    `${c.title} ${c.location}`.toLowerCase().includes(term)
  );

  async function handleSave() {
    const houseIds = Object.keys(houseChecked).filter((id) => houseChecked[id]);
    const carIds = Object.keys(carChecked).filter((id) => carChecked[id]);

    const res = await fetch(`${API}/api/featured`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ houseIds, carIds }),
    });
    const data = await res.json();
    setMsg(data.success ? "Saved." : "Error saving.");
  }

  return (
    <>
      <h1>Featured Listings</h1>
      <p className="sub">Choose what shows in the homepage&apos;s Featured section.</p>

      <div className="toolbar">
        <input
          type="text"
          id="searchInput"
          placeholder="Search houses or cars by title or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button id="saveBtn" onClick={handleSave}>
          Save
        </button>
      </div>

      <div id="msg">{msg}</div>
      {loading && <p id="loadingMsg">Loading current selection...</p>}
      {loadError && <p id="loadingMsg">Could not load listings.</p>}

      {!loading && !loadError && (
        <>
          <div className="picker-section">
            <h2>Houses</h2>
            <p className="hint">Pick any number â€” only the first 2 will show on the homepage.</p>
            <div id="houseList">
              {filteredHouses.map((h) => (
                <label key={h._id}>
                  <input
                    type="checkbox"
                    checked={!!houseChecked[h._id]}
                    onChange={(e) =>
                      setHouseChecked((prev) => ({ ...prev, [h._id]: e.target.checked }))
                    }
                  />{" "}
                  {h.title} - {h.location}
                </label>
              ))}
            </div>
            {filteredHouses.length === 0 && (
              <p className="no-match show">No houses match your search.</p>
            )}
          </div>

          <div className="picker-section">
            <h2>Cars</h2>
            <p className="hint">Pick any number â€” only the first 1 will show on the homepage.</p>
            <div id="carList">
              {filteredCars.map((c) => (
                <label key={c._id}>
                  <input
                    type="checkbox"
                    checked={!!carChecked[c._id]}
                    onChange={(e) =>
                      setCarChecked((prev) => ({ ...prev, [c._id]: e.target.checked }))
                    }
                  />{" "}
                  {c.title} - {c.location}
                </label>
              ))}
            </div>
            {filteredCars.length === 0 && (
              <p className="no-match show">No cars match your search.</p>
            )}
          </div>
        </>
      )}
    </>
  );
}
