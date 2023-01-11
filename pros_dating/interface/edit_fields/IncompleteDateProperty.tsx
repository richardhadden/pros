import { Component, createSignal, createRef } from "solid-js";

const IncompleteDateProperty: Component<{
  value: any;
  setValue: (v: any) => void;
}> = (props) => {
  const [dateFieldPreviousValue, setDateFieldPreviousValue] = createSignal(
    props.value ?? ""
  );
  const displayDate = (dateString) => {
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
    const YEAR_MONTH_DAY_REGEX =
      /^\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/;
    const YEAR_MONTH_REGEX = /^\d{4}-(0[1-9]|1[012])$/;
    const YEAR_REGEX = /^\d{4}$/;
    if (YEAR_REGEX.test(dateString)) {
      return "Year " + dateString;
    } else if (YEAR_MONTH_REGEX.test(dateString)) {
      const month = monthNames[parseInt(dateString.slice(5), 10) - 1];
      const year = dateString.slice(0, 4);
      return `${month} ${year}`;
    } else if (YEAR_MONTH_DAY_REGEX.test(dateString)) {
      const month = monthNames[parseInt(dateString.slice(5, 7), 10) - 1];
      const year = dateString.slice(0, 4);
      const day =
        dateString.slice(8, 9) === "0"
          ? dateString.slice(9, 10)
          : dateString.slice(8, 10);
      return `${day} ${month} ${year}`;
    } else if (dateString === "") {
      return "";
    } else {
      return "invalid date";
    }
  };

  const setDate = (e: InputEvent) => {
    e.preventDefault();
    let v = (e.currentTarget as HTMLInputElement).value;
    if (e.inputType === "deleteContentBackward") {
      console.log(v);
      if (v.slice(-1) === "-") {
        console.log("ends with -");
        v = v.slice(0, -1);
        props.setValue(v);
      } else if (v.length === 1) {
        props.setValue("");
      } else {
        props.setValue(v);
      }
      return;
    }
    const INCREMENTAL_DATE_REGEX =
      /^(\d{1,3}$|\d{4}(?:-|(?:-(?:[01]$|(?:0[1-9]|1[120]))(?:-|(?:-(?:[1230]$|(?:0[1-9]|[12][0-9]|[12][0-9]|[03][01]))))?)?))$/;

    if ((v.length === 5 || v.length === 8) && v.slice(-1) !== "-") {
      v = v.slice(0, -1) + "-" + v.slice(-1);
      console.log("added dash to ", v);
    }

    if (INCREMENTAL_DATE_REGEX.test(v)) {
      props.setValue(v);
      setDateFieldPreviousValue(v);
    } else {
      props.setValue(dateFieldPreviousValue());
    }
  };

  return (
    <div class="w-fit">
      <input
        step="any"
        class="border-b-primary bg-base-100 focus:border-primary focus:bg-base-200 w-36 appearance-none rounded-tl-md rounded-tr-md border-b-2 border-t-2 border-l-2 border-r-2 border-t-transparent border-l-transparent border-r-transparent bg-transparent pl-5 pr-5 pb-3 pt-3 focus:rounded-t-md focus:rounded-b-md focus:border-2 focus:border-b-2 focus:shadow-inner focus:outline-none"
        value={props.value || ""}
        onInput={setDate}
      />
      <div class="prose-sm mt-2 text-center font-semibold uppercase text-gray-300">
        {displayDate(props.value)}
      </div>
    </div>
  );
};

export default IncompleteDateProperty;
