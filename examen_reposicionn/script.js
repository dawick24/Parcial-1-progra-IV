document.getElementById('vehiculoForm').addEventListener('submit', function(e) {
  e.preventDefault();

  let marca = document.getElementById('marca').value.trim();
  let modelo = document.getElementById('modelo').value.trim();
  let year = document.getElementById('year').value.trim();
  let num_motor = document.getElementById('num_motor').value.trim();
  let num_chasis = document.getElementById('num_chasis').value.trim();

  // Expresiones regulares específicas
  const regexMarca = /^[A-Z]{3,}$/;      // Solo MAYÚSCULAS, mínimo 3 letras
  const regexModelo = /^[A-Za-z]{4,}$/;  // Mayúsculas o minúsculas, mínimo 4 letras
  const regexYear = /^[0-9]{4}$/;        // Solo números (exactamente 4 dígitos)

  // Validaciones
  if (!regexMarca.test(marca)) {
    alert("Marca inválida: solo MAYÚSCULAS, mínimo 3 letras.");
    return;
  }

  if (!regexModelo.test(modelo)) {
    alert("Modelo inválido: debe tener al menos 4 letras.");
    return;
  }

  if (!regexYear.test(year)) {
    alert("Año inválido: debe contener solo 4 números.");
    return;
  }

  // Validaciones básicas adicionales
  if (num_motor.length < 5) {
    alert("Número de motor inválido: mínimo 5 caracteres.");
    return;
  }

  if (num_chasis.length < 5) {
    alert("Número de chasis inválido: mínimo 5 caracteres.");
    return;
  }

  // Envío con fetch
  let formData = new FormData(document.getElementById('vehiculoForm'));
  fetch("guardar_vehiculo.php", {
    method: "POST",
    body: formData
  })
  .then(res => res.text())
  .then(data => {
    alert("Vehículo agregado: " + data);
    document.getElementById('vehiculoForm').reset(); // limpia el formulario
  })
  .catch(error => {
    alert("Error al guardar los datos.");
    console.error(error);
  });
});
