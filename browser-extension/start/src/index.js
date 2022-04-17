// form fields
const form = document.querySelector('.form-data');
const region = document.querySelector('.region-name');
const apiKey = document.querySelector('.api-key');

// results
const errors = document.querySelector('.errors');
const loading = document.querySelector('.loading');
const results = document.querySelector('.result-container');
const usage = document.querySelector('.carbon-usage');
const fossilfuel = document.querySelector('.fossil-fuel');
const myregion = document.querySelector('.my-region');
const clearBtn = document.querySelector('.clear-btn');

form.addEventListener('submit', (e) => handleSubmit(e));
clearBtn.addEventListener('click', (e) => reset(e));
init();

function init() {
  //if anything is in localStorage, pick it up
  const storedApiKey = localStorage.getItem('apiKey');
  const storedRegion = localStorage.getItem('regionName');

  //set icon to be generic green
  //todo

  if (storedApiKey === null | storedRegion === null) {
    //if we don't have the key, show the form
    form.style.display = 'block';
    results.style.display = 'none';
    loading.style.display = 'none';
    clearBtn.style.display = 'none';
    errors.textContent = '';
  } else {
    //if we have saved keys/regions in localStorage, show the result when they load
    displayCarbonUsage(storedApiKey, storedRegion);
    results.style.display = 'none';
    form.style.display = 'none';
    clearBtn.style.display = 'block';
  }
}

function reset(e) {
  e.preventDefault();
  //clear local storage for region only
  localStorage.removeItem('regionName');
  init();
}

function handleSubmit(e) {
  e.preventDefault();
  setUpUser(apiKey.value, region.value);
}

function setUpUser(apiKey, regionName) {
  localStorage.setItem('apiKey', apiKey);
  localStorage.setItem('regionName', regionName);
  loading.style.display = 'block';
  errors.textContent = '';
  clearBtn.style.display = 'block';
  //make initial call
  displayCarbonUsage(apiKey, regionName);
}

import axios from '../node_modules/axios';
async function displayCarbonUsage(apiKey, region) {
  try {
    await axios
      .get('http://api.co2signal.com/v1/latest', {
        params: {
            countryCode: region,
        },
        headers: {
          'auth-token': apiKey,
        },
      }).then((response) => {
        console.log("response obtained " + response.data.data.carbonIntensity);
        let CO2 = Math.floor(response.data.data.carbonIntensity);
        //calculateColor(CO2);

        loading.style.display = 'none';
        form.style.display = 'none';
        myregion.textContent = region;
        usage.textContent = Math.round(response.data.data.carbonIntensity) + ' grams (grams CO2 emitted per kilowatt hour)';
        fossilfuel.textContent = response.data.data.fossilFuelPercentage.toFixed(2) + 
                                '% (percentage of fossil fuels used to generate electricity)';
        results.style.display = 'block';
      });
  } catch (error) {
    console.log(error);
    loading.style.display = 'none';
    results.style.display = 'none';
    errors.textContent = 'Sorry, we have no data for the region you have requested.';
  }
}