// Configuración inicial
let chart;
const defaultCountry = 'CR'; // Costa Rica por defecto
const allowedCountries = ['MX', 'IN', 'BR', 'CR']; // Países permitidos: México, India, Brasil, Costa Rica
const defaultIndicator = 'NY.GDP.MKTP.KD.ZG';

async function init() {
    await loadCountries();
    renderChart();
    updateData(defaultCountry, defaultIndicator);

    // Eventos de cambio
    document.getElementById('countrySelect').addEventListener('change', handleUpdate);
    document.getElementById('indicatorSelect').addEventListener('change', handleUpdate);
}

async function loadCountries() {
    const select = document.getElementById('countrySelect');
    try {
        // Se consulta el endpoint /country que devuelve metadatos y nombres oficiales [1, 3, 4]
        const response = await fetch('https://api.worldbank.org/v2/country?per_page=300&format=json');
        const data = await response.json();
        
        // El Banco Mundial devuelve un array donde el segundo elemento [5] contiene la lista de países [6]
        const countriesList = data[5];

        select.innerHTML = '';
        countriesList.forEach(country => {
            // Filtro de seguridad: Solo permitir IDs dentro de la lista allowedCountries
            if (allowedCountries.includes(country.id)) {
                const option = document.createElement('option');
                option.value = country.id;
                option.textContent = country.name;
                
                // Establecer Costa Rica como seleccionado por defecto
                if (country.id === defaultCountry) option.selected = true;
                
                select.appendChild(option);
            }
        });
    } catch (error) {
        console.error("Error cargando la lista restringida de países:", error);
    }
}

function renderChart() {
    const options = {
        chart: {
            type: 'area',
            height: 400,
            toolbar: { show: true }, 
            zoom: { enabled: false }
        },
        colors: ['#0f172a'], // Color profesional Slate-900
        series: [],
        xaxis: { categories: [] },
        yaxis: {
            labels: {
                formatter: (val) => val ? val.toLocaleString() : 0 
            }
        },
        stroke: { curve: 'smooth' },
        noData: { text: 'Cargando datos...' }
    };
    chart = new ApexCharts(document.querySelector("#chart"), options);
    chart.render();
}

async function updateData(country, indicator) {
    try {
        // Uso del parámetro mrv=3 para asegurar la recuperación de los últimos 3 años disponibles [7-9]
        const response = await fetch(`https://api.worldbank.org/v2/country/${country}/indicator/${indicator}?mrv=3&format=json`);
        const data = await response.json();

        // Verificación de existencia de datos para el indicador en ese país [10]
        if (!data || !data[5]) {
            chart.updateSeries([{ name: 'Sin datos disponibles', data: [] }]);
            return;
        }

        const readings = data[5].reverse();
        const values = readings.map(r => r.value);
        const labels = readings.map(r => r.date);
        const indicatorName = readings.indicator.value;

        chart.updateOptions({
            xaxis: { categories: labels },
            title: { 
                text: `${indicatorName} - ${country}`, 
                align: 'center', 
                style: { color: '#334155', fontSize: '16px' } 
            }
        });
        chart.updateSeries([{ name: country, data: values }]);
    } catch (error) {
        console.error("Error al actualizar datos:", error);
    }
}

function handleUpdate() {
    const c = document.getElementById('countrySelect').value;
    const i = document.getElementById('indicatorSelect').value;
    updateData(c, i);
}

init();
