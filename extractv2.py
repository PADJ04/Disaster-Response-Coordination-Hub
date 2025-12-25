import ee
import geemap
import datetime
import math

# =============================================================================
# 1. AUTHENTICATE & INITIALIZE
# =============================================================================
my_project = 'disasterresponsecoordination01'

try:
    ee.Initialize(project=my_project)
except Exception:
    ee.Authenticate()
    ee.Initialize(project=my_project)

print("Authentication successful. Starting analysis...")

# =============================================================================
# 2. SETTINGS
# =============================================================================
# now = datetime.datetime(2019, 8, 15) 
now = datetime.datetime.now()

DIFF_THRESHOLD = 1.35
CONNECTED_PIXELS = 17
MIN_AREA_SQKM = 1.0

# Time Setup
after_end = now
after_start = now - datetime.timedelta(days=15)
before_end = after_end - datetime.timedelta(days=365)
before_start = after_start - datetime.timedelta(days=365)

ee_after_start = ee.Date(after_start.strftime('%Y-%m-%d'))
ee_after_end = ee.Date(after_end.strftime('%Y-%m-%d'))
ee_before_start = ee.Date(before_start.strftime('%Y-%m-%d'))
ee_before_end = ee.Date(before_end.strftime('%Y-%m-%d'))

print(f"Analysis Period: {after_start.date()} to {after_end.date()}")

# =============================================================================
# 3. DATA PROCESSING
# =============================================================================
admin1 = ee.FeatureCollection('FAO/GAUL/2015/level1')
karnataka = admin1.filter(ee.Filter.eq('ADM1_NAME', 'Karnataka'))
geometry = karnataka.geometry()

hydrosheds = ee.Image('WWF/HydroSHEDS/03VFDEM')
gsw = ee.Image('JRC/GSW1_4/GlobalSurfaceWater')

collection = ee.ImageCollection('COPERNICUS/S1_GRD') \
    .filter(ee.Filter.eq('instrumentMode', 'IW')) \
    .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH')) \
    .filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING')) \
    .filter(ee.Filter.eq('resolution_meters', 10)) \
    .filter(ee.Filter.bounds(geometry)) \
    .select('VH')

before = collection.filter(ee.Filter.date(ee_before_start, ee_before_end)).mosaic().clip(geometry)
after = collection.filter(ee.Filter.date(ee_after_start, ee_after_end)).mosaic().clip(geometry)

def gamma_map(img):
    natural_img = ee.Image.constant(10).pow(img.divide(10)).rename('intensity')
    params = {'reducer': ee.Reducer.mean().combine(reducer2=ee.Reducer.variance(), sharedInputs=True),
              'kernel': ee.Kernel.square(radius=3)}
    stats = natural_img.reduceNeighborhood(**params)
    mean = stats.select('intensity_mean')
    variance = stats.select('intensity_variance')
    ci = variance.sqrt().divide(mean)
    cu = 1.0 / math.sqrt(5)
    cmax = math.sqrt(2) * cu
    img_filtered = natural_img.expression(
        "(ci < cu) ? mean : (ci > cmax) ? img : ((alpha - 1) * mean + sqrt((alpha - 1)**2 * mean**2 + 4 * alpha * img * mean)) / (2 * alpha)",
        {'ci': ci, 'cu': cu, 'cmax': cmax, 'mean': mean, 'img': natural_img, 'alpha': ee.Image.constant(1 + cu*cu).divide(ci.multiply(ci).subtract(cu*cu))}
    )
    return img_filtered.log10().multiply(10)

print("Applying Speckle Filter...")
before_filtered = gamma_map(before)
after_filtered = gamma_map(after)

difference = after_filtered.divide(before_filtered)
flooded = difference.gt(DIFF_THRESHOLD).rename('water').selfMask()

permanent_water = gsw.select('seasonality').gte(5).clip(geometry)
flooded = flooded.updateMask(permanent_water.unmask(0).Not())
slope = ee.Algorithms.Terrain(hydrosheds).select('slope')
flooded = flooded.updateMask(slope.gt(5).Not())
connections = flooded.connectedPixelCount(25)
flooded = flooded.updateMask(connections.gte(CONNECTED_PIXELS))

# =============================================================================
# 4. VECTOR CONVERSION (UPDATED FOR POLYGONS)
# =============================================================================
print("Converting to flood polygons...")

vectors = flooded.reduceToVectors(
    geometry=geometry,
    crs=flooded.projection(),
    scale=500,
    geometryType='polygon',  # Ensures we get shapes, not points
    eightConnected=False,
    labelProperty='zone',
    reducer=ee.Reducer.countEvery(),
    maxPixels=1e13,
    bestEffort=True
)

# Function to add Area property and filter small zones
def add_area_properties(feature):
    area = feature.geometry().area(10).divide(1e6) # Sq Km
    return feature.set({
        'area_sqkm': area,
        'date': after_end.strftime('%Y-%m-%d'),
        'polygon_id': feature.id()
    })

# Add properties and then Filter
print(f"Filtering polygons smaller than {MIN_AREA_SQKM} sqkm...")
flood_polygons = vectors.map(add_area_properties).filter(ee.Filter.gt('area_sqkm', MIN_AREA_SQKM))

# =============================================================================
# 5. EXPORT AS GEOJSON
# =============================================================================
out_file = 'Karnataka_Flood_Polygons.geojson'
print("Downloading GeoJSON data...")

try:
    geemap.ee_to_geojson(flood_polygons, filename=out_file)
    print(f"Success! Data saved to {out_file}")
except Exception as e:
    print(f"Error: {e}")