import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AddLocation.css";

const AddLocation = ({ setLocations }) => {
  const navigate = useNavigate();
  const [newLocation, setNewLocation] = useState({
    name: "",
    desc: "",
    lat: "",
    lng: "",
  });

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (
      newLocation.name &&
      newLocation.desc &&
      newLocation.lat &&
      newLocation.lng
    ) {
      const newLoc = {
        location_name: newLocation.name,
        description: newLocation.desc,
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

        console.log(response);

        // Ambil ulang data dari API setelah menambahkan
        const updatedResponse = await fetch(
          "http://localhost:2246/api/locations"
        );
        const updatedResult = await updatedResponse.json();

        // Filter dan format lokasi yang valid
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

        setLocations(formattedLocations); // Update lokasi di Home
        setNewLocation({ name: "", desc: "", lat: "", lng: "" }); // Reset form

        navigate("/"); // Kembali ke halaman Home setelah sukses
      } catch (error) {
        console.error("Gagal mengirim data:", error);
        alert("Terjadi kesalahan saat mengirim data ke server");
      }
    }
  };

  return (
    <div className="add-location-container">
      <h2>Tambah Lokasi Baru</h2>
      <form onSubmit={handleFormSubmit}>
        <input
          type="text"
          placeholder="Nama Lokasi"
          value={newLocation.name}
          onChange={(e) =>
            setNewLocation({ ...newLocation, name: e.target.value })
          }
        />
        <input
          type="text"
          placeholder="Deskripsi"
          value={newLocation.desc}
          onChange={(e) =>
            setNewLocation({ ...newLocation, desc: e.target.value })
          }
        />
        <input
          type="number"
          placeholder="Latitude"
          value={newLocation.lat}
          onChange={(e) =>
            setNewLocation({ ...newLocation, lat: e.target.value })
          }
        />
        <input
          type="number"
          placeholder="Longitude"
          value={newLocation.lng}
          onChange={(e) =>
            setNewLocation({ ...newLocation, lng: e.target.value })
          }
        />
        <button type="submit">RT</button>
      </form>
      <button onClick={() => navigate("/")}>Kembali</button>
    </div>
  );
};

export default AddLocation;
