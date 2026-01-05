export const MAP_CONFIG = {
    // Coordinates are System Rules for this specific deployment
    DEFAULT_CENTER: [-0.9532459140793406, 100.46803723241885], 
    MIN_ZOOM: 14,
    MAX_ZOOM: 18,
    
    // Logical Bounds (System Constraint)
    MAX_BOUNDS: [
      [-0.97, 100.44], // SW
      [-0.93, 100.49], // NE
    ],
  
    // Tunable Visual Styles (Theme)
    STYLES: {
      POLYLINE: {
        COLOR: "#3b82f6",
        WEIGHT: 4,
        OPACITY: 0.6,
        DASH_ARRAY: "10, 10",
      },
      NODE: {
        RADIUS: 6,
        COLOR: "#fff",
        FILL_COLOR: "#3b82f6",
      },
      MARKER: {
        ICON_SIZE: [25, 41],
        ICON_ANCHOR: [12, 41],
      },
      ANIMATION_DURATION: 1.5,
    },
  
    TILES: {
      SATELLITE: {
        URL: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        ATTRIBUTION: "Tiles © Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
      },
      CLEAN: {
        URL: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        ATTRIBUTION: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors &copy; <a href=\"https://carto.com/attributions\">CARTO</a>",
      },
    },
  };
