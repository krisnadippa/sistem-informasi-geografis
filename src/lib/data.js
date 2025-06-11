import axios from "axios";

export async function fetchRuasJalan() {
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

    return response.data.ruasjalan ?? [];
    // return response ?? [];
  } catch (error) {}
}

export async function fetchRegion() {
  try {
    const authToken = localStorage.getItem("token");

    const response = await axios.get(
      `https://gisapis.manpits.xyz/api/mregion`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    return response ?? [];
  } catch (error) {}
}

export async function fetchKecamatan({ kabupatenId }) {
  try {
    const authToken = localStorage.getItem("token");

    const response = await axios.get(
      `https://gisapis.manpits.xyz/api/kecamatan/${kabupatenId}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    return response ?? [];
  } catch (error) {}
}

export async function fetchDesa({ kecamatanId }) {
  try {
    const authToken = localStorage.getItem("token");

    const response = await axios.get(
      `https://gisapis.manpits.xyz/api/desa/${kecamatanId}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    return response ?? [];
  } catch (error) {}
}

export async function fetchExisting() {
  try {
    const authToken = localStorage.getItem("token");

    const response = await axios.get(
      `https://gisapis.manpits.xyz/api/meksisting`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    return response ?? [];
  } catch (error) {}
}

export async function fetchKondisi() {
  try {
    const authToken = localStorage.getItem("token");

    const response = await axios.get(
      `https://gisapis.manpits.xyz/api/mkondisi`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    return response ?? [];
  } catch (error) {}
}

export async function fetchJenisJalan() {
  try {
    const authToken = localStorage.getItem("token");

    const response = await axios.get(
      `https://gisapis.manpits.xyz/api/mjenisjalan`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    return response ?? [];
  } catch (error) {}
}

export async function fetchKecamatanByDesaId({ desaId }) {
  try {
    const authToken = localStorage.getItem("token");

    const response = await axios.get(
      `https://gisapis.manpits.xyz/api/kecamatanbydesaid/${desaId}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    return response ?? [];
  } catch (error) {}
}
