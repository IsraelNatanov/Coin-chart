import React, { useEffect, useState, useRef } from 'react';
import Chart from 'react-apexcharts';
import axios from 'axios';
import FormControl from '@mui/material/FormControl';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import './coinChart.css'

export default function CoinChart() {
  const [series, setSeries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allData, setAllData] = useState([]);
  const [allDataBySelect, setAllDataBySelect] = useState([]);
  const [isCoinVisible, setIsCoinVisible] = useState({});
  const [error, setError] = useState('');
  const rangeInputRef = useRef(null);

  const url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false';

  useEffect(() => {
    fetchData();
  }, []);

  // API call and data processing
  const fetchData = async () => {
    try {
      const response = await axios.get(url);
      const data = response.data;

      const names = data.map(coin => coin.name);
      const marketCaps = data.map(coin => coin.market_cap);

      setAllData(data);
      setAllDataBySelect(data);
      setCategories(names);
      setSeries([{ name: 'Market Cap', data: marketCaps }]);

      // Here I create an object that each of the names of the coins will be a key by itself,
      // and the value will be boolean according to the toggle of that currency.
      const visibilityState = {};
      data.forEach(coin => {
        visibilityState[coin.name] = true;
      });
      setIsCoinVisible(visibilityState);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Error fetching data. Please try again later.');
    }
  };


  useEffect(() => {
    //  Add an event listener for the range input
    // Using vanilla javascript for functionality and efficiency
    if (rangeInputRef.current) {
      rangeInputRef.current.addEventListener('input', handleRangeChange);
    }
    return () => {
      if (rangeInputRef.current) {
        rangeInputRef.current.removeEventListener('input', handleRangeChange);
      }
    };
  }, [isCoinVisible]);


  // A function that returns the name of the currency with the highest market capitalization
  const getLargestMarketCap = (data) => {
    if (data.length === 0) return null;
    let maxMarketCap = data[0].market_cap;
    let coinWithMaxMarketCap = data[0].name;
    for (let i = 1; i < data.length; i++) {
      if (data[i].market_cap > maxMarketCap) {
        maxMarketCap = data[i].market_cap;
        coinWithMaxMarketCap = data[i].name;
      }
    }
    return coinWithMaxMarketCap;
  };


  const largestMarketCapCoin = getLargestMarketCap(allData); //Name of the currency with the highest market capitalization

  const options = {
    chart: {
      height: 350,
      type: 'bar',
    },
    plotOptions: {
      bar: {
        borderRadius: 10,
        columnWidth: '50%',
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      width: 0
    },
    grid: {
      row: {
        colors: ['#fff', '#f2f2f2']
      }
    },
    xaxis: {
      labels: {
        rotate: -45
      },
      categories: categories, // Names of all 10 coins
      tickPlacement: 'on'
    },
    yaxis: {
      title: {
        text: 'Market Cap in USD',
      }
    },
    noData: {
      text: 'There is no data to display'
    },
    // Display a note on the chart
    annotations: {
      xaxis: [
        {
          x: largestMarketCapCoin, //The name of the currency with the highest market value
          borderColor: '#00E396',
          label: {
            borderColor: '#00E396',
            orientation: 'horizontal',
            text: 'the highest market cap'
          }
        }
      ]
    },
    // Displaying the market value for each currency in a tooltip
    tooltip: {
      y: {
        formatter: function (val) {
          return "$ " + val.toLocaleString();
        }
      }
    }
  };

  // update chart according to the input and toggle
  const updateChart = (data, visibilityState) => {
    const visibleData = data.filter(coin => visibilityState[coin.name]);
    const names = visibleData.map(coin => coin.name);
    const marketCaps = visibleData.map(coin => coin.market_cap);
    setCategories(names);
    setSeries([{ name: 'Market Cap', data: marketCaps }]);
  };

  // Dealing with the currency toggle
  const toggleVisibility = (currencyName) => {
    setIsCoinVisible((prevVisibility) => {
      const newVisibility = { ...prevVisibility, [currencyName]: !prevVisibility[currencyName] };
      updateChart(allDataBySelect, newVisibility);
      return newVisibility;
    });
  };

  // The function is linked to the eventListener of javascript vanilv according to the input that the user chooses.
  // The function will call the updateChart function and transfer to it all currencies whose market_cap is higher than the value of the input
  const handleRangeChange = (event) => {
    const value = event.target.value;
    const filteredData = allData.filter(coin => coin.market_cap >= value);
    setAllDataBySelect(filteredData)
    updateChart(filteredData, isCoinVisible);
  };

  return (
    <div>
      {error ? (
        <div style={{ color: 'red' }}>{error}</div>
      ) : (
        <>
          <Chart options={options} series={series} type="bar" height={350} />
          <FormControl component="fieldset" variant="standard">
            <FormGroup>
              {Object.keys(isCoinVisible).map((coinName) => (
                <FormControlLabel
                  key={coinName}
                  control={
                    <Switch checked={isCoinVisible[coinName]} onChange={() => toggleVisibility(coinName)} name={coinName} />
                  }
                  label={coinName}
                />
              ))}
            </FormGroup>
          </FormControl>
          <div className='input-range'>
            <label htmlFor="marketCapRange">Filter by Market Cap:</label>
            <input
              type="range"
              id="marketCapRange"
              min="0"
              max={Math.max(...allData.map(coin => coin.market_cap))}
              defaultValue='0'
              ref={rangeInputRef} // Use the ref for the range input
            />
          </div>
        </>)}
    </div>

  );
};


