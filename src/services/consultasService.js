export async function getHistorialClinicoByMascota(mascotaId) {
  const res = await fetch(
    `http://localhost:5000/api/mascotas/${mascotaId}/consultas`
  );

  if (!res.ok) {
    throw new Error("Could not load clinical history.");
  }

  const data = await res.json();

  return {
    mascota: {
      id: data.mascota?.id ?? "",
      nombre: data.mascota?.nombre ?? "",
      raza: data.mascota?.raza ?? "",
      edad: data.mascota?.edad ?? "",
      sexo: data.mascota?.sexo ?? "",
      peso: data.mascota?.peso ?? "",
    },
    cliente: {
      id: data.cliente?.id ?? "",
      nombre: data.cliente?.nombre ?? "",
      telefono: data.cliente?.telefono ?? "",
      correo: data.cliente?.correo ?? "",
      direccion: data.cliente?.direccion ?? "",
    },
    consultas: Array.isArray(data.consultas)
      ? data.consultas.map((consulta) => ({
          id: consulta.id ?? "",
          fecha: consulta.fecha ?? "",
          hora: consulta.hora ?? "",
          doctor: consulta.doctor ?? consulta.doctor_nombre ?? "",
          motivo: consulta.motivo ?? "",
          diagnostico: consulta.diagnostico ?? "",
          observaciones: consulta.observaciones ?? "",
          estado: consulta.estado ?? "",
          gravedad: consulta.gravedad ?? "",
        }))
      : [],
  };
}