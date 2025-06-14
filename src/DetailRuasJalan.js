import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./DetailRuasJalan.css";
import {
  fetchRegion,
  fetchKecamatan,
  fetchDesa,
  fetchExisting,
  fetchKondisi,
  fetchJenisJalan,
} from "./lib/data"; // Asumsikan Anda punya file service API

const DetailRuasJalan = () => {
  const [ruasJalan, setRuasJalan] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [calculatedPanjang, setCalculatedPanjang] = useState(0);

  // State untuk form & modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRuas, setCurrentRuas] = useState(null);
  const [formData, setFormData] = useState({});

  // State untuk dropdown
  const [kabupaten, setKabupaten] = useState([]);
  const [kecamatan, setKecamatan] = useState([]);
  const [desa, setDesa] = useState([]);
  const [existing, setExisting] = useState([]);
  const [kondisi, setKondisi] = useState([]);
  const [jenisJalan, setJenisJalan] = useState([]);

  // State untuk selected IDs di form
  const [selectedKabupatenId, setSelectedKabupatenId] = useState(null);
  const [selectedKecamatanId, setSelectedKecamatanId] = useState(null);

  const navigate = useNavigate();

  // FETCH ALL RUAS JALAN
  const fetchRuasJalanData = async () => {
    setLoading(true);
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
      setRuasJalan(response.data.ruasjalan);
      setError(null);
    } catch (error) {
      console.error("Error fetching ruas jalan data:", error);
      setError("Gagal mengambil data ruas jalan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuasJalanData();
  }, []);

  // FETCH INITIAL DROPDOWN DATA
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

  // FETCH KECAMATAN/DESA BERDASARKAN PILIHAN
  useEffect(() => {
    const fetchDependentData = async () => {
      if (selectedKabupatenId) {
        try {
          const response = await fetchKecamatan({
            kabupatenId: selectedKabupatenId,
          });
          setKecamatan(response.data.kecamatan || []);
          // Jangan reset desa jika sedang dalam mode edit
          if (!currentRuas) {
            setDesa([]); // Reset desa hanya saat bukan mode edit
          }
        } catch (error) {
          console.error("Gagal mengambil data kecamatan:", error);
        }
      }
      if (selectedKecamatanId) {
        try {
          const response = await fetchDesa({
            kecamatanId: selectedKecamatanId,
          });
          setDesa(response.data.desa || []);
        } catch (error) {
          console.error("Gagal mengambil data desa:", error);
        }
      }
    };
    fetchDependentData();
  }, [selectedKabupatenId, selectedKecamatanId]);

  // HANDLE DELETE
  const handleDelete = async (idRuas) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus ruas jalan ini?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(
          `https://gisapis.manpits.xyz/api/ruasjalan/${idRuas}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        alert("Ruas jalan berhasil dihapus!");
        setRuasJalan((prev) => prev.filter((ruas) => ruas.id !== idRuas));
      } catch (error) {
        console.error("Gagal menghapus ruas jalan:", error);
        alert("Gagal menghapus ruas. Silakan coba lagi.");
      }
    }
  };

  // HANDLE EDIT CLICK - DIPERBAIKI
  const handleEditClick = async (ruas) => {
    setCurrentRuas(ruas);

    // Set semua form data termasuk panjang dan field lainnya
    setFormData({
      nama_ruas: ruas.nama_ruas || "",
      lebar: ruas.lebar || "",
      panjang: ruas.panjang || "", // Tambahkan field panjang
      keterangan: ruas.keterangan || "", // Tambahkan field keterangan
      eksisting_id: ruas.eksisting_id || "",
      kondisi_id: ruas.kondisi_id || "",
      jenisjalan_id: ruas.jenisjalan_id || "",
      desa_id: ruas.desa_id || "",
    });

    // Set dropdown values berdasarkan data yang ada
    // Asumsi: API mengembalikan kabupaten_id dan kecamatan_id dalam data ruas
    // Jika tidak ada, Anda perlu mendapatkannya dari relasi desa
    if (ruas.kabupaten_id) {
      setSelectedKabupatenId(ruas.kabupaten_id);
    }
    if (ruas.kecamatan_id) {
      setSelectedKecamatanId(ruas.kecamatan_id);
    }

    // Jika tidak ada kabupaten_id/kecamatan_id langsung,
    // kita perlu fetch berdasarkan desa_id
    if (!ruas.kabupaten_id && ruas.desa_id) {
      try {
        // Fetch detail desa untuk mendapatkan kecamatan_id dan kabupaten_id
        const token = localStorage.getItem("token");
        const desaResponse = await axios.get(
          `https://gisapis.manpits.xyz/api/desa/${ruas.desa_id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (desaResponse.data.desa) {
          const desaData = desaResponse.data.desa;
          if (desaData.kecamatan_id) {
            setSelectedKecamatanId(desaData.kecamatan_id);

            // Fetch kecamatan untuk mendapatkan kabupaten_id
            const kecamatanResponse = await axios.get(
              `https://gisapis.manpits.xyz/api/kecamatan/${desaData.kecamatan_id}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            if (kecamatanResponse.data.kecamatan?.kabupaten_id) {
              setSelectedKabupatenId(
                kecamatanResponse.data.kecamatan.kabupaten_id
              );
            }
          }
        }
      } catch (error) {
        console.error("Gagal mengambil data relasi desa:", error);
      }
    }

    setIsModalOpen(true);
  };

  // HANDLE MODAL CLOSE
  const handleModalClose = () => {
    setIsModalOpen(false);
    setCurrentRuas(null);
    setFormData({});
    setSelectedKabupatenId(null);
    setSelectedKecamatanId(null);
    setKecamatan([]);
    setDesa([]);
  };

  // HANDLE FORM CHANGE
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // HANDLE UPDATE SUBMIT
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `https://gisapis.manpits.xyz/api/ruasjalan/${currentRuas.id}`,
        {
          ...formData,
          kode_ruas: formData.nama_ruas, // Sesuaikan jika kode ruas berbeda
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Data berhasil diperbarui!");
      fetchRuasJalanData(); // Ambil ulang data untuk merefresh tabel
      handleModalClose();
    } catch (error) {
      console.error("Gagal memperbarui data:", error);
      alert("Gagal memperbarui data. Periksa kembali input Anda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="detail-container">
        <header className="detail-header">
          <h1>Detail Data Ruas Jalan</h1>
          <button onClick={() => navigate("/home")} className="button-back">
            Kembali ke Peta
          </button>
        </header>

        {loading && <p>Memuat data...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nama Ruas</th>
                <th>Panjang (KM)</th>
                <th>Lebar (M)</th>
                <th>Keterangan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {ruasJalan.map((ruas) => {
                console.log(ruas);
                return (
                  <tr key={ruas.id}>
                    <td>{ruas.id}</td>
                    <td>{ruas.nama_ruas}</td>
                    <td>{ruas.panjang}</td>
                    <td>{ruas.lebar}</td>
                    <td>{ruas.keterangan}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleEditClick(ruas)}
                          className="button-edit"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(ruas.id)}
                          className="button-delete"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal untuk Form Edit */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Edit Ruas Jalan</h2>
            <form onSubmit={handleUpdateSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Nama Ruas</label>
                  <input
                    type="text"
                    name="nama_ruas"
                    value={formData.nama_ruas || ""}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Panjang (KM)</label>
                  <input
                    type="number"
                    name="panjang"
                    value={formData.panjang || ""}
                    onChange={handleFormChange}
                    step="0.01"
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label>Lebar (meter)</label>
                  <input
                    type="number"
                    name="lebar"
                    value={formData.lebar || ""}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Keterangan</label>
                  <input
                    name="keterangan"
                    value={formData.keterangan || ""}
                    onChange={handleFormChange}
                    rows="3"
                  />
                </div>
                <div className="form-group">
                  <label>Kabupaten</label>
                  <select
                    value={selectedKabupatenId || ""}
                    onChange={(e) =>
                      setSelectedKabupatenId(Number(e.target.value))
                    }
                    required
                  >
                    <option value="">Pilih Kabupaten</option>
                    {kabupaten.map((k) => (
                      <option key={k.id} value={k.id} className="my-option">
                        {k.kabupaten}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Kecamatan</label>
                  <select
                    value={selectedKecamatanId || ""}
                    onChange={(e) =>
                      setSelectedKecamatanId(Number(e.target.value))
                    }
                    required
                    disabled={!selectedKabupatenId || kecamatan.length === 0}
                  >
                    <option value="">Pilih Kecamatan</option>
                    {kecamatan.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.value}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Desa</label>
                  <select
                    name="desa_id"
                    value={formData.desa_id || ""}
                    onChange={handleFormChange}
                    required
                    disabled={!selectedKecamatanId || desa.length === 0}
                  >
                    <option value="">Pilih Desa</option>
                    {desa.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.value}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Eksisting</label>
                  <select
                    name="eksisting_id"
                    value={formData.eksisting_id || ""}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Pilih Eksisting</option>
                    {existing.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.eksisting}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Kondisi</label>
                  <select
                    name="kondisi_id"
                    value={formData.kondisi_id || ""}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Pilih Kondisi</option>
                    {kondisi.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.kondisi}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Jenis Jalan</label>
                  <select
                    name="jenisjalan_id"
                    value={formData.jenisjalan_id || ""}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Pilih Jenis Jalan</option>
                    {jenisJalan.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.jenisjalan}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="button-secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="button-primary"
                  disabled={loading}
                >
                  {loading ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default DetailRuasJalan;
