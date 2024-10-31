let servId,
  vendorId,
  serviceName,
  userId,
  upiId,
  totalamt,
  mobile,
  userSplit,
  url,
  custId,
  qrId,
  phone,
  PaymentStatus,
  amtValue,
  datauserId,
  totalAmtval;
const urlParams = new URLSearchParams(window.location.search);
//check URL
const fUrl =
  window.location.hostname == "pay.referthru.com"
    ? "https://app.referthru.com/#/login"
    : "https://73c9-117-206-225-168.ngrok-free.app/graphql";

const apiUrl =
  window.location.hostname == "pay.referthru.com"
    ? "https://api.referthru.com/graphql"
    : "https://73c9-117-206-225-168.ngrok-free.app/graphql";

// fetch service name
$(document).ready(function () {
  totalAmtval = sessionStorage.getItem("price");
  if (totalAmtval !== undefined) {
    $("#totalAmtval").text(totalAmtval);
  }
  servId = urlParams.get("sid");
  if (servId) {
    $.ajax({
      type: "POST",
      url: apiUrl,
      data: JSON.stringify({
        query:
          "query getService($input:GetServiceParams!){ \n GetService(options:$input){ \n id\n name\n vendorId\n sub\n isActive\n viewCount\n address{   street\n   postalCode\n   city\n   state\n   country\n } \n } }",
        variables: {
          input: {
            id: servId,
          },
        },
      }),
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      success: function (data) {
        vendorId = data.data.GetService.vendorId;
        serviceName = data.data.GetService.name;
        let title_el = document.querySelector("title");
        if (title_el)
          title_el.innerHTML = serviceName + " | referThru Service Feedback";
        $(".tittle").text(serviceName);
      },
    });
  } else {
    $("#feedback-from").addClass("scanqr");
    $("#referform").hide();
    $(".form-block-2.w-form div:first-child").attr(
      "style",
      "text-align:center"
    );
    $(".form-block-2.w-form div:first-child")
      .next()
      .attr("style", "text-align:center");
    $(".form-block-2.w-form div:first-child")
      .next()
      .text("Please Scan QR Code.");
  }
});

//Amount
function allowNumbersOnly(e) {
  var code = e.which ? e.which : e.keyCode;
  if (code > 31 && (code < 48 || code > 57)) {
    e.preventDefault();
  }
}

const openPaymentApp = async (payApp) => {
  switch (payApp) {
    case "PAYTM":
      url = "paytmmp://";
      break;
    case "GPAY":
      url = "gpay://upi/";
      break;
    case "WHATSAPP":
      url = "upi://";
      break;
    case "PHONEPE":
      url = "phonepe://";
      break;
    default:
      url = "";
      break;
  }
  return url;
};
// function priceCheck(element, event) {
//   result =
//     (event.charCode >= 48 && event.charCode <= 57) || event.charCode === 46;
//   if (result) {
//     let t = element.value;
//     if (t === "" && event.charCode === 46) {
//       return false;
//     }

//     let dotIndex = t.indexOf(".");
//     console.log(dotIndex);
//     let valueLength = t.length;
//     if (dotIndex > 0) {
//       if (dotIndex + 2 < valueLength) {
//         return false;
//       } else {
//         return true;
//       }
//     } else if (dotIndex === 0) {
//       return false;
//     } else {
//       return true;
//     }
//   } else {
//     return false;
//   }
// }

//back button
$("#back").click(function () {
  let mobile = $("#phone").val();
  let upid = $("#upid").val();
  let totalamt = $("#amount").val();
  $("#phone").text(mobile);
  $("#upid").text(upid);
  $("#amount").text(totalamt);
  $("#feedback-from").show();
  $("div#feedback-from-detail").hide();
});

// Adding user details
async function addUser() {
  $("#animationWindow").show();
  const result = await $.ajax({
    type: "POST",
    url: apiUrl,
    data: JSON.stringify({
      query:
        "mutation addCustomerDetails($input:AddCustomerDetailsCollectionParams!){\n  AddCustomerDetails(input:$input){\n    phone\n    serviceId\n    serviceName\n    amount\n    cashbackAmount\n       upiId\n    vendorId\n    userExists\n    cashbackStatus\n    id\n }\n}",
      variables: {
        input: {
          phone: mobile,
          serviceId: servId,
          amount: Number(totalamt),
          cashback: userSplit,
          // "upiId": $("#upid").val()
          //referInterest: boolValue,
        },
      },
    }),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function (response) {
      if (response.data.AddCustomerDetails.id) {
        custId = response.data.AddCustomerDetails.id;
        openPayment(custId);
      } else {
        $("#paynowbtn")
          .html("Something went wrong. Please try again.")
          .addClass("error-msg");
      }
    },
  });
}

// pay now
function openPayment(id) {
  $("#animationWindow").show();
  const response2 = $.ajax({
    type: "POST",
    url: apiUrl,
    data: JSON.stringify({
      query:
        "mutation createDirectPaymentQR($input:CreateDirectPaymentQRParams!){\n  GenerateDirectPaymentQR(Input:$input){\n    razorpayId\n    flowType\n    paymentAmount\n fixedAmount\n serviceId\n imageURL\n paymentAmount\n vendorId\n customerId\n customerUserId\n usage\n status\n created\n serviceName\n paymentStatus\n qrUpiLink\n qrUpi\n}\n}",
      variables: {
        input: {
          serviceId: servId,
          vendorId: vendorId,
          paymentAmount: Number(totalamt),
          phone: mobile,
          serviceName: serviceName,
          customerDetailsId: id,
        },
      },
    }),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function (response) {
      if (response.data.GenerateDirectPaymentQR.razorpayId) {
        qrId = response.data.GenerateDirectPaymentQR.razorpayId;

        window.open(
          url + response.data.GenerateDirectPaymentQR.qrUpiLink.split("://")[1],
          "_self"
        );
        sessionStorage.setItem("key", id);
        datauserId = sessionStorage.getItem("key");
        sessionStorage.setItem("price", totalamt);
        paymentStatus(qrId, id);
      }
    },
  });
}

function paymentStatus(qrId, id) {
  $.ajax({
    type: "POST",
    url: apiUrl,
    data: JSON.stringify({
      query:
        "query getQR($query: GetQRParams!) { \n GetQR(Input: $query) {   \n name   \n razorpayId   \n paymentStatus   \n description   \n usage   \n type   \n imageURL   \n qrUpi   \n qrUpiLink   \n fixedAmount   \n paymentAmount   \n amountReceived   \n paymentsReceivedCount   \n customerId   \n customerUserId   \n status   \n created   \n serviceId   \n serviceName   \n vendorId   \n referCode  \n} \n}",
      variables: {
        query: {
          qrId: qrId,
        },
      },
    }),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function (response) {
      $("#home").hide();
      PaymentStatus = response.data.GetQR.paymentStatus;

      if (response.data.GetQR.paymentStatus == "paid") {
        $("#animationWindow").hide();
        window.location.href =
          window.location.href.split("?")[0] +
          "success.html?sid=" +
          servId +
          "&dataid=" +
          datauserId;
      }
      // if(response.data.GetQR.paymentStatus=='pending' ){

      //     setInterval(() => {

      //         console.log("hi")
      //             paymentStatus(qrId);

      //     }, 10000);
      // }
    },
  });
}

setInterval(() => {
  if (qrId !== undefined) {
    paymentStatus(qrId);
  }
}, 5000);

$("ul.paymenttype li").click(function () {
  $(this).style = null;
  $("#pay-button").removeAttr("disabled");
  let allElem = $(this).parent().find("li");
  if (allElem != null) {
    for (let elem of allElem) {
      if (elem.hasAttributes("style")) {
        elem.removeAttribute("style");
      }
    }
  }
  $(this).attr(
    "style",
    "border-style: 2px solid;border: solid 0.2em;width: auto;border-radius: 35%;color: #f2461e "
  );
});

function onDOMLoaded(e) {
  anim.addEventListener("complete", function () {});
}

// Funtion to update rating
let stars = document.getElementsByClassName("star");
let rating;

function gfg(n) {
  remove();
  for (let i = 0; i < n; i++) {
    if (n == 1) cls = "checked";
    else if (n == 2) cls = "checked";
    else if (n == 3) cls = "checked";
    else if (n == 4) cls = "checked";
    else if (n == 5) cls = "checked";
    stars[i].className = "star " + cls;
    rating = n;
  }
}

function remove() {
  let i = 0;
  while (i < 5) {
    stars[i].className = "star";
    i++;
  }
}
$("#star_event li").click(function () {
  $(this).addClass("selected");
  $(this).find("img").attr("src", "images/Star_full.png");
});
var destroyed = false;
var starratingOld = new StarRating(".star-rating-old");
$(".toggle-star-rating").click(function () {
  if (!destroyed) {
    starratingOld.destroy();
    destroyed = true;
  } else {
    starratingOld.rebuild();
    destroyed = false;
  }
});

// Form input validation
$("#amount, #phone").bind("keyup", function () {
  if (allFilled()) $("#next").removeAttr("disabled");
});

function allFilled() {
  var filled = true;
  $("body input").each(function () {
    if ($(this).val() == "") filled = false;
  });
  return filled;
}

//upid Validation
// document.getElementById("upid").addEventListener("keyup", function() {
//     $("span#upiderror").empty();
//     var upi_Id = $("#upid").val();
//     let regex = /^[\w.-]+@[\w.-]+$/;
//     if (upi_Id == null) {
//         return "false";
//     }
//     if (regex.test(upi_Id) == true) {
//         $("#errorUpi").html("").removeClass("error-msg");
//         return "true";
//     } else {
//         $("#errorUpi").html("Please enter valid UPI").addClass("error-msg");

//     }
// });

//phone Validation
if ($("#phone").val() !== undefined) {
  $("#phone").change(function () {
    $("#next").prop("disabled", "disabled");

    phone = $("#phone").val();
    let regex = new RegExp("^[6-9][0-9]{9}$");
    // upi_Id
    // is empty return false
    if (phone == null) {
      $("#next").prop("disabled", "disabled");
      return "false";
    }
    // Return true if the upi_Id
    // matched the ReGex
    if (regex.test(phone) == true) {
      $("#errorPhone").html("").removeClass("error-msg");
      if ($("#amount").val() >= 100) {
        $("#next").removeAttr("disabled");
      }

      return "true";
    } else {
      $("#next").prop("disabled", "disabled");
      $("#errorPhone").html("Please enter valid Mobile").addClass("error-msg");
    }
  });
}

//Amount Validation
if ($("#amount").val() !== undefined) {
  $("#amount").change(function (ev) {
    $("#next").prop("disabled", "disabled");
    $("#errorAmount").html("").removeClass("error-msg");

    var amountValidator =
      ev.target.value.trim() >= 100 &&
      ev.target.value.trim().match(/^[0-9]*(\.[0-9]+)?$/);
    amtValue = ev.target.value;
    if ($("#amount").val() < 100) {
      $("#next").prop("disabled", "disabled");
      $("#errorAmount").html("Minimum amount is 100").addClass("error-msg");
    } else if (amtValue >= 1000000) {
      $("#next").prop("disabled", "disabled");
      $("#errorAmount").html("Max amount is 99999").addClass("error-msg");
    } else {
      $("#next").prop("disabled", "disabled");
      if ($("#phone").val() !== "" && $("#amount").val() >= 100) {
        if (amountValidator) {
          $("#next").removeAttr("disabled");
        }
      } else {
        $("#next").prop("disabled", "disabled");
        $("#errorPhone")
          .html("Please enter valid Mobile")
          .addClass("error-msg");
      }
    }
  });
}
//next detailed user info
$("#next").click(function () {
  if (amtValue >= 100 && amtValue < 1000000) {
    $.ajax({
      type: "POST",
      url: apiUrl,
      data: JSON.stringify({
        query:
          "query GetCustomerQRSplitDetails($input:CustomerSplitParams!){ \n GetCustomerSplitDetails(Input:$input){ \n referthruSplit\n vendorSplit\n orderPrice\n orderGST\n GST\n razorpayPlatformCharge\n referralSplitObject{   accountId\n   customerId\n   status\n   userId\n split\n username\n contact\n   } \n referCode } }",
        variables: {
          input: {
            serviceId: servId,
            amount: Number(amtValue),
            phone: phone,
          },
        },
      }),
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      success: function (data) {
        userSplit = data.data.GetCustomerSplitDetails.referralSplitObject.split;
        mobile = $("#phone").val();
        let upid = $("#upid").val();
        totalamt = $("#amount").val();
        $("span#paymobile").text(mobile);
        $("span#payupi").text(upid);
        $("strong#usersplit").text(userSplit);

        $(".totalamt").text(totalamt);
        $("#feedback-from").hide();
        $("div#feedback-from-detail").show();
      },
    });
  } else {
    $("#next").prop("disabled", "disabled");
  }
});
$("#submit-button").click(function () {
  let dataid = urlParams.get("dataid");

  var ele = document.getElementsByName("refer");
  let refer;
  for (i = 0; i < ele.length; i++) {
    if (ele[i].checked) refer = ele[i].value;
  }
  let boolValue;
  if (refer) {
    boolValue = refer.toLowerCase() === "true";
  }

  const response2 = $.ajax({
    type: "POST",
    url: apiUrl,
    data: JSON.stringify({
      query:
        "mutation updateCustomerDetails($input:UpdateCustomerDetailsParams!){\n  UpdateCustomerDetails(input:$input){\n    phone\n    serviceId\n    serviceName\n amount\n cashbackAmount\n  rating\n upiId\n vendorId\n QRId\n  userExists\n cashbackStatus\n id\n }\n}",
      variables: {
        input: {
          id: dataid,
          referInterest: boolValue,
          rating: $("span.gl-active.gl-selected").data("value"),
        },
      },
    }),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function (response) {
      $("#success").replaceWith(
        "<center><div style='text-align:center;color:#212121'>Thank you for your feedback!<br/> Redirecting you to referThru App <br/><br/><img src='./assets/img/loader.gif' width='90px' hieght='100px'></div></center>"
      );
      setTimeout(function () {
        window.location.href = "https://app.referthru.com/#/login";
      }, 1000);
    },
  });
});
var select = function (s) {
    return document.querySelector(s);
  },
  selectAll = function (s) {
    return document.querySelectorAll(s);
  },
  animationWindow = select("#animationWindow"),
  animData = {
    wrapper: animationWindow,
    animType: "svg",
    loop: true,
    prerender: true,
    autoplay: true,
    path: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/35984/play_fill_loader.json",
    rendererSettings: {
      //context: canvasContext, // the canvas context
      //scaleMode: 'noScale',
      //clearCanvas: false,
      //progressiveLoad: false, // Boolean, only svg renderer, loads dom elements when needed. Might speed up initialization for large number of elements.
      //hideOnTransparent: true //Boolean, only svg renderer, hides elements when opacity reaches 0 (defaults to true)
    },
  },
  anim;
anim = bodymovin.loadAnimation(animData);
anim.addEventListener("DOMLoaded", onDOMLoaded);
anim.setSpeed(1);

function onDOMLoaded(e) {
  anim.addEventListener("complete", function () {});
}
