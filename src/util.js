import {endOfWeek, format, startOfWeek} from "date-fns";

export function getDateRange(){
    const today = new Date();
    const monday = startOfWeek(today, { weekStartsOn: 1 });
    const sunday = endOfWeek(today, { weekStartsOn: 2 });
    const dateFrom = format(monday, 'yyyy-MM-dd');
    const dateTo = format(sunday, 'yyyy-MM-dd');
    return {
        dateFrom,
        dateTo
    };
}