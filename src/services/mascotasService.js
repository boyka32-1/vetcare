export async function getMascotas() {
  const res = await fetch("http://localhost:5000/api/mascotas");

  if (!res.ok) {
    throw new Error("Could not load pets.");
  }

  const data = await res.json();

  return Array.isArray(data)
    ? data.map((mascota) => ({
        id:
          mascota.id ??
          mascota.Id ??
          mascota.ID ??
          mascota.mascotaId ??
          mascota.MascotaId ??
          mascota._id ??
          "",
        nombre: mascota.nombre ?? mascota.Nombre ?? "",
        raza: mascota.raza ?? mascota.Raza ?? "",
      }))
    : [];
}