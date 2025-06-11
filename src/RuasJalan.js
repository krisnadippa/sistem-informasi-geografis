import L from "leaflet";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import {
  FeatureGroup,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
} from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import axios from "axios";
import {
  fetchDesa,
  fetchExisting,
  fetchJenisJalan,
  fetchKecamatan,
  fetchKondisi,
  fetchRegion,
} from "./lib/data";
import polyline from "@mapbox/polyline";
import { decode } from "polyline-encoded";

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

const RuasJalan = () => {
  const [user, setUser] = useState({ name: "User", email: "" });

  const [ruasJalan, setRuasJalan] = useState([]);
  const [createdLineLatLngs, setCreatedLineLatLngs] = useState([]);
  const [calculatedPanjang, setCalculatedPanjang] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [kabupaten, setKabupaten] = useState([]);
  const [kecamatan, setKecamatan] = useState([]);
  const [desa, setDesa] = useState([]);

  const [selectedKabupatenId, setSelectedKabupatenId] = useState(null);
  const [selectedKecamatanId, setSelectedKecamatanId] = useState(null);

  const [existing, setExisting] = useState([]);
  const [kondisi, setKondisi] = useState([]);
  const [jenisJalan, setJenisJalan] = useState([]);

  const [showForm, setShowForm] = useState(false);

  const navigate = useNavigate();

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("user");
    navigate("/");
  };

  // FETCH LINE RUAS JALAN
  useEffect(() => {
    const fetchRuasJalan = async () => {
      try {
        const authToken = localStorage.getItem("token");

        const response = await axios.get(
          `https://gisapis.manpits.xyz/api/ruasjalan`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        const decodedRuas = response.data.ruasjalan.map((ruas) => ({
          ...ruas,
          pathsDecoded: L.Polyline.fromEncoded(ruas.paths).getLatLngs(),
        }));

        setRuasJalan(decodedRuas);
      } catch (error) {
        console.error("Error fetching ruas jalan data:", error);
      }
    };

    fetchRuasJalan();
  }, []);

  // FETCH INITIAL DATA
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [kab, eks, kond, jenis] = await Promise.all([
          fetchRegion(),
          fetchExisting(),
          fetchKondisi(),
          fetchJenisJalan(),
        ]);

        setKabupaten(kab?.data?.kabupaten || []);
        setExisting(eks?.data?.eksisting || []);
        setKondisi(kond?.data?.eksisting || []);
        setJenisJalan(jenis?.data?.eksisting || []);
      } catch (error) {
        console.error("Gagal mengambil data awal:", error);
      }
    };

    fetchInitialData();
  }, []);

  // FETCH KECAMATAN/DESA BASED ON SELECTED KABUPATEN/KECAMATAN
  useEffect(() => {
    const fetchDependentData = async () => {
      try {
        if (selectedKabupatenId) {
          const response = await fetchKecamatan({
            kabupatenId: selectedKabupatenId,
          });
          setKecamatan(response.data.kecamatan || []);
          setDesa([]); // Reset desa saat kabupaten berubah
        }

        if (selectedKecamatanId) {
          const response = await fetchDesa({
            kecamatanId: selectedKecamatanId,
          });
          setDesa(response.data.desa || []);
        }
      } catch (error) {
        console.error("Gagal mengambil data kecamatan/desa:", error);
      }
    };

    fetchDependentData();
  }, [selectedKabupatenId, selectedKecamatanId]);

  const _created = (e) => {
    const latlngs = e.layer.getLatLngs();
    setCreatedLineLatLngs(latlngs);

    let totalLength = 0;
    for (let i = 0; i < latlngs.length - 1; i++) {
      totalLength += latlngs[i].distanceTo(latlngs[i + 1]);
    }

    const lengthInKm = (totalLength / 1000).toFixed(2);
    setCalculatedPanjang(parseFloat(lengthInKm));

    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const encodedPath = polyline.encode(
      createdLineLatLngs.map((point) => [point.lat, point.lng])
    );

    const formData = new FormData(e.currentTarget);
    const nama_ruas = formData.get("nama_ruas");
    const panjang = formData.get("panjang");
    const lebar = formData.get("lebar");
    const desa_id = formData.get("desa_id");
    const eksisting_id = formData.get("eksisting_id");
    const kondisi_id = formData.get("kondisi_id");
    const jenisjalan_id = formData.get("jenisjalan_id");
    const keterangan = formData.get("keterangan");
    const paths = encodedPath;

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `https://gisapis.manpits.xyz/api/ruasjalan`,
        {
          paths: paths,
          desa_id: desa_id,
          kode_ruas: nama_ruas,
          nama_ruas: nama_ruas,
          panjang: panjang,
          lebar: lebar,
          eksisting_id: eksisting_id,
          kondisi_id: kondisi_id,
          jenisjalan_id: jenisjalan_id,
          keterangan: keterangan,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setLoading(false);
      console.log(res);
    } catch (error) {
      if (error?.response?.data.message === 500) {
        setError("Data yang dimasukkan tidak valid. Silakan periksa kembali.");
      }
    }
  };

  const hapusRuas = async (idRuas) => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.delete(
        `https://gisapis.manpits.xyz/api/ruasjalan/${idRuas}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Ruas berhasil dihapus:", response.data);

      // Perbarui daftar ruas setelah penghapusan
      setRuasJalan((prev) => prev.filter((ruas) => ruas.id !== idRuas));
    } catch (error) {
      console.error("Gagal menghapus ruas jalan:", error);
      alert("Gagal menghapus ruas. Silakan coba lagi.");
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
          <div className="menu-item " onClick={() => navigate("/home")}>
            <span>Dashboard</span>
          </div>

          <div className="menu-item active">
            <span>Ruas jalan</span>
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
            {/* Form */}
            {showForm && (
              <form
                id="ruasForm"
                className="add-form-container"
                onSubmit={handleSubmit}
              >
                <div className="form-header">
                  <h3>Tambah Ruas Jalan</h3>
                </div>

                <div className="form-body">
                  {error && <div className="form-error-message">{error}</div>}
                  <div className="form-group">
                    <label htmlFor="nama_ruas">Nama Ruas</label>
                    <input
                      type="text"
                      id="nama_ruas"
                      name="nama_ruas"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="kabupaten">Kabupaten</label>
                    <select
                      id="kabupaten"
                      name="kabupaten"
                      required
                      onChange={(e) => {
                        const selectedId = Number(e.target.value);
                        setSelectedKabupatenId(selectedId);
                      }}
                    >
                      <option value="">Pilih kabupaten</option>
                      {kabupaten.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.kabupaten}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="kecamatan">Kecamatan</label>
                    <select
                      id="kecamatan"
                      name="kecamatan"
                      required
                      onChange={(e) => {
                        const selectedId = Number(e.target.value);
                        setSelectedKecamatanId(selectedId);
                      }}
                    >
                      <option value="">Pilih kecamatan</option>
                      {kecamatan.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.value}{" "}
                          {/* Pastikan "value" memang nama kecamatannya */}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="desa_id">Desa</label>
                    <select id="desa_id" name="desa_id" required>
                      <option value="">Pilih desa</option>
                      {desa.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.value}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="panjang">Panjang (km)</label>
                    <input
                      type="number"
                      id="panjang"
                      name="panjang"
                      required
                      value={calculatedPanjang}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="lebar">Lebar (meter)</label>
                    <input type="number" id="lebar" name="lebar" required />
                  </div>

                  <div className="form-group">
                    <label htmlFor="eksisting_id">Existing</label>
                    <select id="eksisting_id" name="eksisting_id" required>
                      <option value="">Pilih existing</option>
                      {existing.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.eksisting}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="kondisi_id">Kondisi</label>
                    <select id="kondisi_id" name="kondisi_id" required>
                      <option value="">Pilih kondisi</option>
                      {kondisi.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.kondisi}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="jenisjalan_id">Jenis Jalan</label>
                    <select id="jenisjalan_id" name="jenisjalan_id" required>
                      <option value="">Pilih jenis jalan</option>
                      {jenisJalan.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.jenisjalan}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="keterangan">Keterangan</label>
                    <input
                      type="text"
                      id="keterangan"
                      name="keterangan"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="button-primary"
                    disabled={loading}
                  >
                    {loading ? "Menyimpan..." : "Tambah Ruas"}
                  </button>
                </div>
              </form>
            )}

            <MapContainer
              center={[-8.579585, 115.234219]}
              zoom={12}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <FeatureGroup>
                <EditControl
                  onCreated={_created}
                  position="topright"
                  draw={{
                    rectangle: false,
                    circle: false,
                    circlemarker: false,
                    marker: false,
                    polygon: false,
                  }}
                ></EditControl>
              </FeatureGroup>

              {ruasJalan.map((ruas, i) => (
                <Polyline
                  key={i}
                  positions={[ruas.pathsDecoded]}
                  color="blue"
                  weight={4}
                >
                  <Popup>
                    <div className="text-sm">
                      <span className="font-semibold">{ruas.nama_ruas}</span>
                      <p>Panjang: {ruas.panjang}</p>
                      <p>Keterangan: {ruas.keterangan}</p>
                      <button onClick={() => hapusRuas(ruas.id)}>Hapus</button>
                    </div>
                  </Popup>
                </Polyline>
              ))}

              {/*  */}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RuasJalan;
