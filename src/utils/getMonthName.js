const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// ** month number (1-12) -> month name, undefined for invalid input
function getMonthName(id) {
  return monthNames[Number(id) - 1];
}

export { monthNames };
export default getMonthName;
