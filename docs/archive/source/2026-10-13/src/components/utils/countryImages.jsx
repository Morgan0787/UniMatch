// Static country-to-image mapping using Unsplash Source API
export const COUNTRY_IMAGES = {
    // Europe
    "Germany": "https://source.unsplash.com/featured/?germany,university,campus",
    "Netherlands": "https://source.unsplash.com/featured/?netherlands,university,architecture",
    "Czech Republic": "https://source.unsplash.com/featured/?prague,university,historic",
    "Poland": "https://source.unsplash.com/featured/?poland,university,building",
    "Hungary": "https://source.unsplash.com/featured/?budapest,university,architecture",
    "Austria": "https://source.unsplash.com/featured/?austria,university,campus",
    "France": "https://source.unsplash.com/featured/?france,university,architecture",
    "Italy": "https://source.unsplash.com/featured/?italy,university,architecture",
    "Spain": "https://source.unsplash.com/featured/?spain,university,campus",
    "Portugal": "https://source.unsplash.com/featured/?portugal,university,building",
    "Belgium": "https://source.unsplash.com/featured/?belgium,university,architecture",
    "Sweden": "https://source.unsplash.com/featured/?sweden,university,modern",
    "Finland": "https://source.unsplash.com/featured/?finland,university,nordic",
    "Norway": "https://source.unsplash.com/featured/?norway,university,modern",
    "Denmark": "https://source.unsplash.com/featured/?denmark,university,architecture",
    "Switzerland": "https://source.unsplash.com/featured/?switzerland,university,alpine",
    "United Kingdom": "https://source.unsplash.com/featured/?uk,university,campus",
    "Ireland": "https://source.unsplash.com/featured/?ireland,university,college",
    
    // North America
    "USA": "https://source.unsplash.com/featured/?usa,university,campus",
    "Canada": "https://source.unsplash.com/featured/?canada,university,modern",
    
    // Asia
    "China": "https://source.unsplash.com/featured/?china,university,campus",
    "South Korea": "https://source.unsplash.com/featured/?korea,university,modern",
    "Japan": "https://source.unsplash.com/featured/?japan,university,campus",
    "Singapore": "https://source.unsplash.com/featured/?singapore,university,modern",
    "Malaysia": "https://source.unsplash.com/featured/?malaysia,university,campus",
    
    // Middle East
    "UAE": "https://source.unsplash.com/featured/?dubai,university,modern",
    
    // Oceania
    "Australia": "https://source.unsplash.com/featured/?australia,university,campus",
    "New Zealand": "https://source.unsplash.com/featured/?newzealand,university,campus",
};

// Generic fallback
export const GENERIC_UNIVERSITY_IMAGE = "https://source.unsplash.com/featured/?university,campus,education";

export function getUniversityImage(university) {
    // Priority 1: Use existing image_url if available
    if (university.image_url) {
        return university.image_url;
    }
    
    // Priority 2: Use country-based image
    if (university.country && COUNTRY_IMAGES[university.country]) {
        return COUNTRY_IMAGES[university.country];
    }
    
    // Priority 3: Generic fallback
    return GENERIC_UNIVERSITY_IMAGE;
}