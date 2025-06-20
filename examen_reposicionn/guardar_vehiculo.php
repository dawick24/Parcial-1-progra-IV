<?php
require_once "Conexion.php";

class Vehiculo {
  public function guardar($data) {
    $conn = new Conexion();
    $pdo = $conn->conectar();

    $sql = "INSERT INTO tbl_vehiculos (marca, modelo, year, num_motor, num_chasis)
            VALUES (:marca, :modelo, :year, :num_motor, :num_chasis)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($data);
    echo "OK";
  }
}

$vehiculo = new Vehiculo();
$vehiculo->guardar([
  "marca" => $_POST['marca'],
  "modelo" => $_POST['modelo'],
  "year" => $_POST['year'],
  "num_motor" => $_POST['num_motor'],
  "num_chasis" => $_POST['num_chasis'],
]);
?>