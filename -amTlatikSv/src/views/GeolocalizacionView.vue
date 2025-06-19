<script setup>
import { ref, onMounted } from 'vue';
import { GoogleMap, Marker } from 'vue3-google-map';

const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const center = ref({ lat: 13.6929, lng: -89.2182 });
const userMarkerOptions = ref(null);
const mapRef = ref(null);
const placesMarkers = ref([]);
const directionsRenderer = ref(null);
const infoWindow = ref(null);
const searchQuery = ref(''); 
const isSearching = ref(false); 

function getUserLocation() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => reject(error),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  });
}

function formatoHorario(horarios) {
  return horarios.length ? horarios.join(", ") : "Horario no disponible";
}

function createPlaceCard(place) {
  const container = document.createElement("div");
  container.style.padding = "2px";
  container.style.maxWidth = "250px";

  const title = document.createElement("h3");
  title.textContent = place.displayName || "Sin nombre";
  title.style.margin = "0 0 5px";
  title.style.fontSize = "16px";

  const address = document.createElement("p");
  address.textContent = place.formattedAddress || "Dirección no disponible";
  address.style.margin = "0 0 5px";
  address.style.fontSize = "14px";

  const schedule = document.createElement("p");
  schedule.textContent = formatoHorario(place.regularOpeningHours?.weekdayDescriptions || []);
  schedule.style.margin = "0 0 5px";
  schedule.style.fontSize = "14px";

  const routeLink = document.createElement("a");
  routeLink.textContent = "Ver ruta";
  routeLink.style.cursor = "pointer";
  routeLink.style.color = "blue";
  routeLink.onclick = () => getRoute(place.location);

  container.appendChild(title);
  container.appendChild(address);
  container.appendChild(schedule);
  container.appendChild(routeLink);

  return container;
}

function getRoute(destination) {
  const directionsService = new window.google.maps.DirectionsService();

  // Limpiar marcadores de lugares (NO el del usuario)
  placesMarkers.value.forEach(marker => marker.setMap(null));
  placesMarkers.value = [];

  // Limpiar rutas anteriores
  if (directionsRenderer.value) {
    directionsRenderer.value.setMap(null);
    directionsRenderer.value = null;
  }

  if (infoWindow.value) {
    infoWindow.value.close();
  }

  const routeMarker = new window.google.maps.Marker({
    position: destination,
    map: mapRef.value.map,
    title: "Destino",
  });

  placesMarkers.value.push(routeMarker); 

  directionsRenderer.value = new window.google.maps.DirectionsRenderer();
  directionsRenderer.value.setMap(mapRef.value.map);

  directionsService.route(
    {
      origin: center.value,
      destination,
      travelMode: window.google.maps.TravelMode.DRIVING,
    },
    (result, status) => {
      if (status === 'OK') {
        directionsRenderer.value.setDirections(result);
      } else {
        console.error('No se pudo obtener la ruta:', status);
      }
    }
  );
}

function clearMap() {
  placesMarkers.value.forEach(marker => marker.setMap(null));
  placesMarkers.value = [];
  
  if (directionsRenderer.value) {
    directionsRenderer.value.setMap(null);
    directionsRenderer.value = null;
  }
  
  if (infoWindow.value) {
    infoWindow.value.close();
  }
  
  searchQuery.value = '';
  isSearching.value = false;
  
  if (userMarkerOptions.value) {
    mapRef.value.map.setCenter(userMarkerOptions.value.position);
    mapRef.value.map.setZoom(15);
  }
}

function searchPlaces() {
  if (isSearching.value) {
    clearMap();
    return;
  }

  const query = searchQuery.value.trim();
  if (!query || !window.google || !window.google.maps) return;

  isSearching.value = true;
  
  const service = new window.google.maps.places.PlacesService(mapRef.value.map);
  const request = {
    query,
    location: center.value,
    radius: 5000,
  };

  service.textSearch(request, (results, status) => {
    if (status === window.google.maps.places.PlacesServiceStatus.OK) {
      // Limpiar marcadores anteriores
      placesMarkers.value.forEach(marker => marker.setMap(null));
      placesMarkers.value = [];

      const bounds = new window.google.maps.LatLngBounds();

      results.forEach((place) => {
        const marker = new window.google.maps.Marker({
          position: place.geometry.location,
          map: mapRef.value.map,
          title: place.name,
        });

        marker.addListener("click", () => {
          const content = createPlaceCard({
            displayName: place.name,
            formattedAddress: place.formatted_address,
            regularOpeningHours: place.opening_hours,
            location: place.geometry.location
          });

          infoWindow.value.setContent(content);
          infoWindow.value.open(mapRef.value.map, marker);
        });

        placesMarkers.value.push(marker);
        bounds.extend(place.geometry.location);
      });

      mapRef.value.map.fitBounds(bounds);
    } else {
      console.error("Error al buscar lugares:", status);
      isSearching.value = false;
    }
  });
}

onMounted(async () => {
  try {
    const userLocation = await getUserLocation();
    center.value = userLocation;

    if (window.google && window.google.maps) {
      infoWindow.value = new window.google.maps.InfoWindow();
      userMarkerOptions.value = {
        position: userLocation,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#4285F4',
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: 'white',
        },
      };
    }
  } catch (error) {
    console.error('Error getting user location:', error);
  }
});
</script>

<template>
  <div>
    <div class="search-bar">
      <input 
        type="text" 
        v-model="searchQuery" 
        placeholder="Buscar lugares..." 
        @keyup.enter="searchPlaces"
      />
      <button 
        type="button" 
        @click="searchPlaces"
        :class="{ 'btn-clear': isSearching }"
      >
        {{ isSearching ? 'Limpiar' : 'Buscar' }}
      </button>
    </div>
    <GoogleMap
      ref="mapRef"
      :api-key="key"
      style="width: 100%; height: 800px"
      :center="center"
      :zoom="15"
    >
      <Marker v-if="userMarkerOptions" :options="userMarkerOptions" />
    </GoogleMap>
  </div>
</template>

<style scoped>
.search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}
.search-bar input {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  width: 300px;
}
.search-bar button {
  padding: 10px 15px;
  background-color: #4285F4;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}
.search-bar button:hover {
  background-color: #357ae8;
}
.search-bar button.btn-clear {
  background-color: #f44336;
}
.search-bar button.btn-clear:hover {
  background-color: #d32f2f;
}
</style>