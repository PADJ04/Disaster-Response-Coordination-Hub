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
# 2. SETTINGS (ADJUSTED FOR ACCURACY)
# =============================================================================
# DATE: Uses today automatically. 
# To check past dates, uncomment the next line:
now = datetime.datetime(2019, 8, 15) 
# now = datetime.datetime.now()

# SETTING 1: STRICTER THRESHOLD (1.50)
# 1.25 picks up muddy fields. 1.50 only picks up real flood water.
DIFF_THRESHOLD = 1.35 

# SETTING 2: MINIMUM PIXEL CLUMP (25)
# Increase this to ignore small puddles/noise.
CONNECTED_PIXELS = 17

# SETTING 3: MINIMUM AREA IN SQ KM (0.05)
# Any flood polygon smaller than this will be deleted from the CSV.
MIN_AREA_SQKM = 0.05

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

# Gamma Map Filter
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
    cu_squared = cu * cu
    numerator = 1 + cu_squared
    denominator = ci.multiply(ci).subtract(cu_squared)
    alpha = ee.Image.constant(numerator).divide(denominator)
    img_filtered = natural_img.expression(
        "(ci < cu) ? mean : (ci > cmax) ? img : ((alpha - 1) * mean + sqrt((alpha - 1)**2 * mean**2 + 4 * alpha * img * mean)) / (2 * alpha)",
        {'ci': ci, 'cu': cu, 'cmax': cmax, 'mean': mean, 'img': natural_img, 'alpha': alpha}
    )
    return img_filtered.log10().multiply(10)

print("Applying Speckle Filter...")
before_filtered = gamma_map(before)
after_filtered = gamma_map(after)

# Flood Calculation
difference = after_filtered.divide(before_filtered)
flooded = difference.gt(DIFF_THRESHOLD).rename('water').selfMask()

# Masks
permanent_water = gsw.select('seasonality').gte(5).clip(geometry)
flooded = flooded.updateMask(permanent_water.unmask(0).Not())

slope = ee.Algorithms.Terrain(hydrosheds).select('slope')
flooded = flooded.updateMask(slope.gt(5).Not())

connections = flooded.connectedPixelCount(25)
flooded = flooded.updateMask(connections.gte(CONNECTED_PIXELS))

# =============================================================================
# 4. VECTOR CONVERSION & FILTERING
# =============================================================================
print("Converting to vectors (Scale=500m)...")

vectors = flooded.reduceToVectors(
    geometry=geometry,
    crs=flooded.projection(),
    scale=500,
    geometryType='polygon',
    eightConnected=False,
    labelProperty='zone',
    reducer=ee.Reducer.countEvery(),
    maxPixels=1e13,
    bestEffort=True
)

# FIXED FUNCTION: Defines coords properly and Filters by Area
def process_and_filter(feature):
    # 1. Calculate Area First
    area = feature.geometry().area(10).divide(1e6)
    
    # 2. Define Coords (The step that was missing before)
    centroid = feature.geometry().centroid(10)
    coords = centroid.coordinates()

    # 3. Logic: If Area > Min_Area, Return Feature. Else Return NULL.
    return ee.Algorithms.If(
        area.gt(MIN_AREA_SQKM), 
        ee.Feature(None).set({
            'polygon_id': feature.id(),
            'longitude': coords.get(0),
            'latitude': coords.get(1),
            'area_sqkm': area,
            'date': after_end.strftime('%Y-%m-%d')
        }),
        None # This drops the feature if it is too small
    )

# Map the function and drop the Nulls (the small areas)
print("Filtering noise (removing small areas < 0.05 sqkm)...")
flood_centroids = vectors.map(process_and_filter, dropNulls=True)

# =============================================================================
# 5. EXPORT
# =============================================================================
out_csv = 'Karnataka_Flood_Centroids.csv'
print("Downloading data...")

try:
    geemap.ee_to_csv(flood_centroids, filename=out_csv)
    print(f"Success! Data saved to {out_csv}")
except Exception as e:
    print(f"Error: {e}")