
function converted_datetime(milliseconds?: number | string): number {
    let current_date_in_millis: number;
    
    if (milliseconds) {
        current_date_in_millis = typeof milliseconds === 'string' ? parseFloat(milliseconds) : milliseconds;
    } else {
        current_date_in_millis = new Date().getTime();
    }

    return current_date_in_millis;
}

export default converted_datetime;


export function readable_date(ms:number) {
    const date = new Date(ms * 1000);

    // Format the date and time
    const options:any = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: 'numeric', 
        minute: 'numeric',
        hour12: true 
    };
    const readable_date = date.toLocaleString('en-US', options);
    return readable_date;
}
