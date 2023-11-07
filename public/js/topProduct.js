fetch("/top-products", {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
  },
})
  .then((response) => response.json())
  .then((data) => {
    var ctx = document.getElementById("myChart").getContext("2d");
    var myChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: data.products.map((product) => product.name),
        datasets: [
          {
            label: "Sold quantity",
            data: data.products.map((product) => product.soldQuantity),
            backgroundColor: [
              "rgba(255, 99, 132, 0.2)",
              "rgba(54, 162, 235, 0.2)",
              "rgba(255, 206, 86, 0.2)",
              "rgba(75, 192, 192, 0.2)",
              "rgba(153, 102, 255, 0.2)",
              "rgba(255, 159, 64, 0.2)",
              "rgba(255, 99, 132, 0.2)",
              "rgba(54, 162, 235, 0.2)",
              "rgba(255, 206, 86, 0.2)",
              "rgba(75, 192, 192, 0.2)",
            ],
            borderColor: [
              "rgba(255,99,132,1)",
              "rgba(54, 162, 235, 1)",
              "rgba(255, 206, 86, 1)",
              "rgba(75, 192, 192, 1)",
              "rgba(153, 102, 255, 1)",
              "rgba(255, 159, 64, 1)",
              "rgba(255, 99, 132, 1)",
              "rgba(54, 162, 235, 1)",
              "rgba(255, 206, 86, 1)",
              "rgba(75, 192, 192, 1)",
            ],
            borderWidth: 2,
          },
        ],
      },
      options: {
        plugins: {
          legend: {
            labels: {
              display: false,
            },
            display: true,
            position: "top",
            align: "center",
            maxWidth: 400,
            maxHeight: 100,
            title: {
              display: true,
              text: "Top 10 Products Sold Quantity Chart",
              font: {
                size: 20,
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            type: "linear",
            ticks: {
              stepSize: 1,
            },
            min: 0,
            max: Math.max(...data.products.map((product) => product.soldQuantity)) + 1,
          },
        },
        layout: {
          padding: {
            left: 150,
            right: 150,
            top: 50,
            bottom: 50,
          }
        },
        animation: {
          duration: 2000,
          easing: "easeInOutQuart",
        },
        // indexAxis: "y",
      },
    });
  });
