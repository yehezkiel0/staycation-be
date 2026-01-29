const BASE_URL = 'http://localhost:5000/api';

async function verify() {
  console.log('Verifying Public API Endpoints...');
  
  try {
    console.log('1. Testing /api/properties/most-picked...');
    const mpRes = await fetch(`${BASE_URL}/properties/most-picked`);
    if (mpRes.ok) {
        const mpData = await mpRes.json();
        console.log(`   SUCCESS: Found ${mpData.count} most picked properties.`);
    } else {
        console.error(`   FAILED: Status ${mpRes.status}`);
        const txt = await mpRes.text();
        console.error('   Response:', txt);
    }

    console.log('2. Testing /api/categories...');
    const catRes = await fetch(`${BASE_URL}/categories`);
    if (catRes.ok) {
        const catData = await catRes.json();
        console.log(`   SUCCESS: Found ${catData.categories ? catData.categories.length : 0} categories.`);
        
        if (catData.categories && catData.categories.length > 0) {
            const firstCatId = catData.categories[0]._id;
            console.log(`3. Testing /api/categories/${firstCatId}/properties...`);
            const cpRes = await fetch(`${BASE_URL}/categories/${firstCatId}/properties`);
             if (cpRes.ok) {
                const cpData = await cpRes.json();
                console.log(`   SUCCESS: Found ${cpData.properties ? cpData.properties.length : 0} properties in category.`);
            } else {
                console.error(`   FAILED: Status ${cpRes.status}`);
            }
        }
    } else {
        console.error(`   FAILED: Status ${catRes.status}`);
    }

    console.log('4. Testing /api/properties...');
    const propRes = await fetch(`${BASE_URL}/properties?limit=5`);
    if (propRes.ok) {
        const propData = await propRes.json();
        console.log(`   SUCCESS: Found ${propData.count} properties (limit 5).`);
    } else {
        console.error(`   FAILED: Status ${propRes.status}`);
    }

  } catch (error) {
      console.error('VERIFICATION ERROR:', error.message);
      console.error('Make sure backend is running on port 5000 and MongoDB is connected.');
  }
}

verify();
