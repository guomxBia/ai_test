/**
 * apiConfig.js
 * Defines all external API instances for data fetching.
 */
import axios from "axios";

export const API_NIOGEMWELLL_URL = 'https://localhost:9443/NiogemsServer/v1/wells';
export const API_USGS_URL='https://energy.usgs.gov/api/uswtdb/v1/turbines';

// 1. Niogems Wells API Instance
export const axiosInstanceNiogemsWell = axios.create({
    baseURL: API_NIOGEMWELLL_URL, 
    timeout: 30000,
});

// 2. USGS Turbines API Instance
export const axiosInstanceUsGsTurb = axios.create({
    baseURL: API_USGS_URL, 
    timeout: 30000,
});

// --- Configuration for Query Path Validation/Defaulting (NEW LOCATION) ---

const niogemsQueryValidator = (path) => {
    const trimmedPath = path.trim();
    if (!trimmedPath.startsWith('/page/')) {
        console.warn("Niogems AI returned invalid path. Falling back to default.");
        return "/page/1/pagesize/10";
    }
    return trimmedPath;
};

const usgsQueryValidator = (path) => {
   // if(!!!path) return;
    const trimmedPath = path.trim();
   // Check if the AI returned a query path starting with '?'
    if (trimmedPath.startsWith('?')) {
        // Prepend the resource name, since the baseURL is now one level up.
        return `${trimmedPath}`; 
    } 
    // If invalid, fall back to the default query path including the resource name.
    console.warn("USGS AI returned invalid path. Falling back to default.");
    return "?limit=10&offset=0";
};

export const API_FETCH_CONFIGS = {
    niogems: {
        instance: axiosInstanceNiogemsWell,
        validator: niogemsQueryValidator,
        queryKey: 'niogems-wells', // Added queryKey for completeness
        enableCondition: (path) => path.length > 10 && path.startsWith('/page/') 
    },
    usgs: {
        instance: axiosInstanceUsGsTurb,
        validator: usgsQueryValidator,
        queryKey: 'usgs-turbines', // Added queryKey for completeness
        enableCondition: (path) => path.length > 5 && path.startsWith('?') 
    }
}

export const parseQueryString = (queryString) => {
    // Remove the leading '?' if it exists
    const params = queryString.startsWith('?') ? queryString.substring(1) : queryString;
    
    // Split by '&' and then by '='
    return params.split('&').reduce((acc, part) => {
        if (!part) return acc;
        
        const [key, value] = part.split('=');
        // Decode the URI component (e.g., replace %20 with space)
        acc[key] = decodeURIComponent(value);
        return acc;
    }, {});
};