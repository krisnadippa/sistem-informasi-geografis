import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./Home.css";

// Fix leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const Home = () => {
  const [user, setUser] = useState({ name: "User", email: "" });
  const [locations, setLocations] = useState([]);
  const [newLocation, setNewLocation] = useState(null);
  const [locationForm, setLocationForm] = useState({ name: "", desc: "" });
  const navigate = useNavigate();

  // Autentikasi dan ambil user
  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
    if (!isAuthenticated) {
      navigate("/");
      return;
    }

    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    if (userData.name) {
      setUser(userData);
    }
  }, [navigate]);

  // Fetch locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch("http://localhost:2246/api/locations");
        const result = await response.json();

        const formattedLocations = result.locations
          .filter(
            (loc) =>
              Math.abs(loc.latitude) <= 90 && Math.abs(loc.longitude) <= 180
          )
          .map((loc) => ({
            id: loc.id,
            name: loc.location_name,
            desc: loc.description,
            position: [loc.latitude, loc.longitude],
          }));

        setLocations(formattedLocations);
      } catch (error) {
        console.error("Gagal mengambil data lokasi:", error);
      }
    };

    fetchLocations();
  }, []);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("user");
    navigate("/");
  };

  // Map click handler
  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setNewLocation({ lat, lng });
        setLocationForm({ name: "", desc: "" });
      },
    });
    return null;
  };

  // Submit form to add location
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (locationForm.name && locationForm.desc && newLocation) {
      const newLoc = {
        location_name: locationForm.name,
        description: locationForm.desc,
        latitude: parseFloat(newLocation.lat),
        longitude: parseFloat(newLocation.lng),
      };

      try {
        const response = await fetch("http://localhost:2246/api/locations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newLoc),
        });

        if (!response.ok) {
          throw new Error("Gagal menambahkan lokasi ke server");
        }

        // Ambil ulang data dari API setelah menambahkan lokasi
        const updatedResponse = await fetch(
          "http://localhost:2246/api/locations"
        );
        const updatedResult = await updatedResponse.json();

        const formattedLocations = updatedResult.locations
          .filter(
            (loc) =>
              Math.abs(loc.latitude) <= 90 && Math.abs(loc.longitude) <= 180
          )
          .map((loc) => ({
            id: loc.id,
            name: loc.location_name,
            desc: loc.description,
            position: [loc.latitude, loc.longitude],
          }));

        setLocations(formattedLocations); // Update state locations
        setNewLocation(null); // Reset the new location state
        setLocationForm({ name: "", desc: "" }); // Reset form
      } catch (error) {
        console.error("Gagal mengirim data:", error);
        alert("Terjadi kesalahan saat mengirim data ke server");
      }
    }
  };

  return (
    <div className="home-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>SIG WebApp</h2>
          <div className="user-info">
            <div className="avatar">{user.name.charAt(0)}</div>
            <div className="user-details">
              <h3>{user.name}</h3>
              <p>{user.email}</p>
            </div>
          </div>
        </div>

        <div className="sidebar-menu">
          <div className="menu-item active">
            <span>Dashboard</span>
          </div>

          <div className="menu-item" onClick={() => navigate("/ruas-jalan")}>
            <span>Ruas Jalan</span>
          </div>
        </div>

        <div className="logout-button" onClick={handleLogout}>
          <span>Logout</span>
        </div>
      </div>

      <div className="main-content">
        <div className="header">
          <h1>Sistem Informasi Geografis</h1>
        </div>

        <div className="content">
          <div className="map-container">
            <MapContainer
              center={[-8.579585, 115.234219]}
              zoom={12}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapClickHandler />

              {locations.map((location) => (
                <Marker key={location.id} position={location.position}>
                  <Popup>
                    <div>
                      <h3>{location.name}</h3>
                      <p>{location.desc}</p>
                      <p>
                        <strong>Koordinat:</strong>
                      </p>
                      <p>Lat: {location.position[0]}</p>
                      <p>Lng: {location.position[1]}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {newLocation && (
                <Marker position={[newLocation.lat, newLocation.lng]}>
                  <Popup>
                    <form onSubmit={handleFormSubmit}>
                      <div>
                        <label>Nama Lokasi:</label>
                        <input
                          type="text"
                          value={locationForm.name}
                          onChange={(e) =>
                            setLocationForm({
                              ...locationForm,
                              name: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div>
                        <label>Deskripsi:</label>
                        <textarea
                          value={locationForm.desc}
                          onChange={(e) =>
                            setLocationForm({
                              ...locationForm,
                              desc: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <button type="submit">Tambahkan</button>
                    </form>
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
