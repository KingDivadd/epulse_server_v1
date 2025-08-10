export function format_date_from_unix(unix_date: number) {
    let passed_data = unix_date
    
    if (unix_date.toString().split('').length > 10) {
        passed_data = unix_date / 1000
    }

    const date = new Date(passed_data * 1000); // Convert Unix timestamp to milliseconds

    // Get day with ordinal suffix
    const day = date.getDate();
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const suffix = (day % 10 <= 3 && day % 100 !== 11 && day % 100 !== 12 && day % 100 !== 13) 
        ? suffixes[day % 10] : suffixes[0];

    // Get month name
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const month = months[date.getMonth()];

    // Get time in 12-hour format
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; // Convert to 12-hour format

    // Return formatted object
    return {
        date: `${day}${suffix} of ${month}`,
        time: `${hours}:${minutes} ${ampm}`
    };
}