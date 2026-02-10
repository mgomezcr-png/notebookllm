// Configuración inicial de ApexCharts
let chart;
const defaultCountry = 'CR'; // Costa Rica por defecto
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
        // Consultar lista completa de países (per_page=300 para evitar paginación) [7]
        const response = await fetch('https://api.worldbank.org/v2/country?per_page=300&format=json');
        const data = await response.json();
        
        select.innerHTML = '';
        data[8].forEach(country => {
            if (country.region.value !== "Aggregates") {
                const option = document.createElement('option');
                option.value = country.id;
                option.textContent = country.name;
                if (country.id === defaultCountry) option.selected = true;
                select.appendChild(option);
            }
        });
    } catch (error) {
        console.error("Error cargando países:", error);
    }
}

function renderChart() {
    const options = {
        chart: {
            type: 'area',
            height: 400,
            toolbar: { show: true }, // Herramientas profesionales de exportación [9]
            zoom: { enabled: false }
        },
        colors: ['#0f172a'], // Slate-900 para apariencia profesional
        series: [],
        xaxis: { categories: [] },
        yaxis: {
            labels: {
                formatter: (val) => val.toLocaleString() // Formato de números legibles [6]
            }
        },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth' },
        noData: { text: 'Cargando datos...' }
    };
    chart = new ApexCharts(document.querySelector("#chart"), options);
    chart.render();
}

async function updateData(country, indicator) {
    try {
        // Consulta con mrv=3 para obtener los 3 años más recientes con datos [2, 3]
        const response = await fetch(`https://api.worldbank.org/v2/country/${country}/indicator/${indicator}?mrv=3&format=json`);
        const data = await response.json();

        if (!data[8]) {
            chart.updateSeries([{ name: 'Sin datos', data: [] }]);
            return;
        }

        // Preparar datos (vienen del más reciente al más antiguo, invertimos para el gráfico)
        const readings = data[8].reverse();
        const values = readings.map(r => r.value);
        const labels = readings.map(r => r.date);
        const indicatorName = readings.indicator.value;

        chart.updateOptions({
            xaxis: { categories: labels },
            title: { text: indicatorName, align: 'center', style: { color: '#334155' } }
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