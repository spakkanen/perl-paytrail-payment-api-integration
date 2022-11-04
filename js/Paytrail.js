var isPaymentRequestEnabled=false;
var isPaymentProgressFailed=false;
var isSessionExpiredCheckEnabled=true;
var paymentMethod="";

var regexemailvalidation = /^[A-Za-z0-9._%+-]+@(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,}\s*$/;

// -------------------------------------------
// Language data.
// Fin.
var button_save_name_fin = "Tallenna";
var payment_wait_text_fin = "Suoritetaan maksutoimenpidett&auml;";
// Eng.
var button_save_name_en = "Save";
var payment_wait_text_en = "Payment verification in progress";

function processPayment(e) {
  console.log("Paytrail:processPayment");
  paymentMethod = jQuery(e).attr("id");
  
  var isValid = checkPaymentInputFields(e);
  if(isValid) {
	jQuery('div.adbox-logo-wrap').removeClass("adbox-border");
    jQuery(e).addClass("adbox-border");
	chargePayment(e);	// Maksutoimenpiteen suorittaminen.
  } else {
	jQuery('div.adbox').removeClass("adbox-border");
    jQuery('div.adbox').removeClass("adbox-border-error");
    jQuery(e).addClass("adbox-border-error");  
  }
}

// Maksa-painike.
function processPaymentClick(e) {
  var isValid = checkPaymentInputFields(e);
  if(isValid) {
	jQuery('div.adbox-logo-wrap').removeClass("adbox-border");
    chargePayment(e);	// Maksutoimenpiteen suorittaminen.
  } else {
	jQuery('div.adbox-logo-wrap').removeClass("adbox-border-error");
  }
}

function checkPaymentInputFields(e) {
  if(jQuery("input#set_firstname").length > 0) {
	showPaymentErrorState(e, "Tallenna henkil&ouml;tiedot ennen maksamista.");
	jQuery("span.errorText2").html("Tallenna henkil&ouml;tiedot ennen maksamista."); jQuery("span#loading").html("");
	return false;
  }
  
  if(jQuery("input#firstname").val().trim() === "") {
	showPaymentErrorState(e, "Etunimi on pakollinen tieto. Lis&auml;&auml; etunimi.");
	jQuery("span.errorText2").html("Etunimi on pakollinen tieto. Lis&auml;&auml; etunimi."); jQuery("span#loading").html("");
	jQuery("input#firstname").addClass('errorNotify'); return false;
  }
  jQuery("input#firstname").removeClass('errorNotify');
  
  if(jQuery("input#lastname").val().trim() === "") {
	showPaymentErrorState(e, "Sukunimi on pakollinen tieto. Lis&auml;&auml; sukunimi.");
	jQuery("span.errorText2").html("Sukunimi on pakollinen tieto. Lis&auml;&auml; sukunimi."); jQuery("span#loading").html("");
	jQuery("input#lastname").addClass('errorNotify'); return false;
  }
  jQuery("input#lastname").removeClass('errorNotify');
  
  if(jQuery("input#address").val().trim() === "") {
	showPaymentErrorState(e, "Osoite on pakollinen tieto. Lis&auml;&auml; osoite.");
	jQuery("span.errorText2").html("Osoite on pakollinen tieto. Lis&auml;&auml; osoite."); jQuery("span#loading").html("");
	jQuery("input#address").addClass('errorNotify'); return false;
  }
  jQuery("input#address").removeClass('errorNotify');
  
  if(jQuery("input#zipcode").val().trim() === "") {
	showPaymentErrorState(e, "Postinumero on pakollinen tieto. Lis&auml;&auml; postinumero.");
	jQuery("span.errorText2").html("Postinumero on pakollinen tieto. Lis&auml;&auml; postinumero."); jQuery("span#loading").html("");
	jQuery("input#zipcode").addClass('errorNotify'); return false;
  } else if(!jQuery("input#zipcode").val().match(/^\d{5}$/)) {
	showPaymentErrorState(e, "Postinumero on v&auml;&auml;r&auml;ss&auml; muodossa. Kirjoita postinumero muotoon 00100.");
	jQuery("span.errorText2").html("Postinumero on v&auml;&auml;r&auml;ss&auml; muodossa. Kirjoita postinumero muotoon 00100."); jQuery("span#loading").html("");
	jQuery("input#zipcode").addClass('errorNotify'); return false;
  }
  jQuery("input#zipcode").removeClass('errorNotify');
  
  if(jQuery("input#city").val().trim() === "") {
	showPaymentErrorState(e, "Postitoimipaikka on pakollinen tieto. Lis&auml;&auml; postitoimipaikka.");
	jQuery("span.errorText2").html("Postitoimipaikka on pakollinen tieto. Lis&auml;&auml; postitoimipaikka."); jQuery("span#loading").html("");
	jQuery("input#city").addClass('errorNotify'); return false;
  }
  jQuery("input#city").removeClass('errorNotify');
  
  if(jQuery("input#telno").val().trim() === "") {
	showPaymentErrorState(e, "Matkapuhelinnumero on pakollinen tieto. Lis&auml;&auml; matkapuhelinnumero.");
	jQuery("span.errorText2").html("Matkapuhelinnumero on pakollinen tieto. Lis&auml;&auml; matkapuhelinnumero."); jQuery("span#loading").html("");
	jQuery("input#telno").addClass('errorNotify'); return false;
  }
  if(jQuery("input#telno").val().match(/[A-Za-z._%-]/)) {
	showPaymentErrorState(e, "Matkapuhelinnumero on v&auml;&auml;r&auml;ss&auml; muodossa. Kirjoita puhelinnumero muotoon 0401234567.");
	jQuery("span.errorText2").html("Matkapuhelinnumero on v&auml;&auml;r&auml;ss&auml; muodossa. Kirjoita puhelinnumero muotoon 0401234567."); jQuery("span#loading").html("");
	jQuery("span#errorText2").html(eval("input_telno_common_error_fin"));
	jQuery("input#telno").addClass('errorNotify'); return false;
  } else if(jQuery("input#telno").val().match(/^\d{1,5}$/)) {
	showPaymentErrorState(e, "Matkapuhelinnumero on v&auml;&auml;r&auml;ss&auml; muodossa. Kirjoita puhelinnumero muotoon 0401234567.");
	jQuery("span.errorText2").html("Matkapuhelinnumero on v&auml;&auml;r&auml;ss&auml; muodossa. Kirjoita puhelinnumero muotoon 0401234567."); jQuery("span#loading").html("");
	jQuery("span#errorText2").html(eval("input_telno_common_error_fin"));
	jQuery("input#telno").addClass('errorNotify'); return false;
  }
  jQuery("input#telno").removeClass('errorNotify');
  
  if(jQuery("input#email").val().trim() === "") {
	showPaymentErrorState(e, "S&auml;hk&ouml;postiosoite on pakollinen tieto. Lis&auml;&auml; s&auml;hk&ouml;postiosoite.");
	jQuery("span.errorText2").html("S&auml;hk&ouml;postiosoite on pakollinen tieto. Lis&auml;&auml; s&auml;hk&ouml;postiosoite."); jQuery("span#loading").html("");
	jQuery("input#email").addClass('errorNotify'); return false;
  } else if(!jQuery("input#email").val().match(regexemailvalidation)) {
	showPaymentErrorState(e, "S&auml;hk&ouml;postiosoite on v&auml;&auml;r&auml;ss&auml; muodossa.");
	jQuery("span.errorText2").html("S&auml;hk&ouml;postiosoite on v&auml;&auml;r&auml;ss&auml; muodossa."); jQuery("span#loading").html("");
	jQuery("input#email").addClass('errorNotify'); return false;
  }
  jQuery("input#email").removeClass('errorNotify');
  
  if(paymentMethod === "") {
	showPaymentErrorState(e, "Maksutapa on pakollinen tieto. Valitse maksutapa.");
	jQuery("span.errorText2").html("Maksutapa on pakollinen tieto. Valitse maksutapa."); jQuery("span#loading").html("");
	return false;
  }
  
  return true;
}

// Create a new payment.
function chargePayment(e) {
	if(isPaymentRequestEnabled) { return; }
	isPaymentRequestEnabled=true;
	showLoadingSymbol(e); // Näytetään lataussymboli.
	
    jQuery.post("../cgi-bin/index.cgi", {
	  create_charge: true,
	  currency: 'eur',
	  amount: (parseFloat(jQuery("span#totalSum").html())*100),
	  title: jQuery("span#product").html(),
	  name: jQuery("span#name").html(),
	  firstname: jQuery("input#firstname").val(),
	  lastname: jQuery("input#lastname").val(),
	  address: jQuery("span#address").html(),
	  zipcode: jQuery("span#zipcode").html(),
	  city: jQuery("span#city").html(),
	  email: jQuery("span#email").html(),
	  telno: jQuery("span#telno").html(),
	  order_number: jQuery("span.booking_no").html(),
	  message: jQuery("textarea#_message").val(),
	  place_id: jQuery("#place_id").val(),
	  paymentmethod: paymentMethod
	}, function(data) {
	  isPaymentRequestEnabled=false;
	  if(data == null) { showPaymentErrorState(e, "Maksukorttia ei pystytty varmentamaan. Maksamisen virhekoodi: 001."); jQuery("span#errorText3").html("Maksukorttia ei pystytty varmentamaan. Maksamisen virhekoodi: 001."); jQuery("span#loading").html(""); isPaymentProgressFailed=true; return; }
	  if(data['result'] == null) { showPaymentErrorState(e, "Maksukorttia ei pystytty varmentamaan. Maksamisen virhekoodi: 002."); jQuery("span#errorText3").html("Maksukorttia ei pystytty varmentamaan. Maksamisen virhekoodi: 002."); jQuery("span#loading").html(""); isPaymentProgressFailed=true; return; }
	  if(data['result'] == 91) { showPaymentErrorState(e, "Maksukorttia ei pystytty varmentamaan. Maksamisen virhekoodi: 003."); jQuery("span#errorText3").html("Maksukorttia ei pystytty varmentamaan. Maksamisen virhekoodi: 003."); jQuery("span#loading").html(""); isPaymentProgressFailed=true; return; }
	  if(data['result'] == 92) { showPaymentErrorState(e, "Maksukorttia ei pystytty varmentamaan. Maksamisen virhekoodi: 004."); jQuery("span#errorText3").html("Maksukorttia ei pystytty varmentamaan. Maksamisen virhekoodi: 004."); jQuery("span#loading").html(""); isPaymentProgressFailed=true; return; }
	  if(data['result'] == 93) { showPaymentErrorState(e, "Maksukorttia ei pystytty varmentamaan. Maksamisen virhekoodi: 005."); jQuery("span#errorText3").html("Maksukorttia ei pystytty varmentamaan. Maksamisen virhekoodi: 005."); jQuery("span#loading").html(""); isPaymentProgressFailed=true; return; }
	  if(data['result'] == 94) { showPaymentErrorState(e, "Maksukorttia ei pystytty varmentamaan. Maksamisen virhekoodi: 006."); jQuery("span#errorText3").html("Maksukorttia ei pystytty varmentamaan. Maksamisen virhekoodi: 006."); jQuery("span#loading").html(""); isPaymentProgressFailed=true; return; }
	  if(data['result'] == 95) { showPaymentErrorState(e, "Maksukorttia ei pystytty varmentamaan. Maksamisen virhekoodi: 007."); jQuery("span#errorText3").html("Maksukorttia ei pystytty varmentamaan. Maksamisen virhekoodi: 007."); jQuery("span#loading").html(""); isPaymentProgressFailed=true; return; }
	  
	  if(data['result'] == 100) { showPaymentErrorState(e, "Maksukortin tiedot ovat virheelliset. Tarkistathan tiedot, kiitos."); jQuery("span#errorText3").html("Maksukortin tiedot ovat virheelliset. Tarkistathan tiedot, kiitos."); jQuery("span#loading").html(""); isPaymentProgressFailed=true; return; }
	  if(data['result'] == 101) { showPaymentErrorState(e, "Maksukorttia ei pystytty varmentamaan. Maksamisen virhekoodi: 021."); jQuery("span#errorText3").html("Maksukorttia ei pystytty varmentamaan. Maksamisen virhekoodi: 021."); jQuery("span#loading").html(""); isPaymentProgressFailed=true; return; }
	  if(data['result'] == 102) { showPaymentErrorState(e, "Maksukorttia ei pystytty varmentamaan. Maksamisen virhekoodi: 022."); jQuery("span#errorText3").html("Maksukorttia ei pystytty varmentamaan. Maksamisen virhekoodi: 022."); jQuery("span#loading").html(""); isPaymentProgressFailed=true; return; }
	  if(data['result'] == 104) { showPaymentErrorState(e, "Maksukorttia ei pystytty varmentamaan. Maksukorttiasi ei hyv&auml;ksytty."); jQuery("span#errorText3").html("Maksukorttia ei pystytty varmentamaan. Maksukorttiasi ei hyv&auml;ksytty."); jQuery("span#loading").html(""); isPaymentProgressFailed=true; return; }
	  if(data['result'] == 105) { showPaymentErrorState(e, "Maksukorttia ei pystytty varmentamaan. Maksukorttisi ei tue t&auml;t&auml; ostotyyppi&auml;."); jQuery("span#errorText3").html("Maksukorttia ei pystytty varmentamaan. Maksukorttisi ei tue t&auml;t&auml; ostotyyppi&auml;."); jQuery("span#loading").html(""); isPaymentProgressFailed=true; return; }
	  if(data['result'] == 106) { showPaymentErrorState(e, "Maksukortin tarjoaja oli tuntematon. Tarkistathan tiedot, kiitos."); jQuery("span#errorText3").html("Maksukortin tarjoaja oli tuntematon. Tarkistathan tiedot, kiitos."); jQuery("span#loading").html(""); isPaymentProgressFailed=true; return; }
	  if(data['result'] == 110) { showPaymentErrorState(e, "Maksukortilta on tehty jo maksu."); jQuery("span#errorText3").html("Maksukortilta on tehty jo maksu."); jQuery("span#loading").html(""); isPaymentProgressFailed=true; return; }
	  
	  if(data['result'] == 120) { showPaymentErrorState(e, "Maksukortilta veloitus ep&auml;onnistui."); jQuery("span#errorText3").html("Maksukortilta veloitus ep&auml;onnistui."); jQuery("span#loading").html(""); isPaymentProgressFailed=true; return; }
	  if(data['result'] == 121) { showPaymentErrorState(e, "Maksukortilta veloitus ep&auml;onnistui."); jQuery("span#errorText3").html("Maksukortilta veloitus ep&auml;onnistui."); jQuery("span#loading").html(""); isPaymentProgressFailed=true; return; }
	  if(data['result'] == 122) { showPaymentErrorState(e, "Maksukortilta veloitus ep&auml;onnistui."); jQuery("span#errorText3").html("Maksukortilta veloitus ep&auml;onnistui."); jQuery("span#loading").html(""); isPaymentProgressFailed=true; return; }
	  
	  if(data['result'] == 300) { showPaymentErrorState(e, "Maksukortilta on jo veloitettu."); jQuery("span#errorText3").html("Maksukortilta on jo veloitettu."); jQuery("span#loading").html(""); isPaymentProgressFailed=true; return; }
	  if(data['result'] == 400) { showPaymentErrorState(e, "Varauksesi on vanhentunut. Ole hyv&auml; ja tee uusi varaus."); jQuery("span#errorText3").html("Varauksesi on vanhentunut. Ole hyv&auml; ja tee uusi varaus."); jQuery("span#loading").html(""); isPaymentProgressFailed=true; return; }
	  if(data['result'] == 500) { showPaymentErrorState(e, "Maksukorttia ei pystytty varmentamaan. Maksamisen virhekoodi: 050."); jQuery("span#errorText3").html("Maksukorttia ei pystytty varmentamaan. Maksamisen virhekoodi: 050."); jQuery("span#loading").html(""); isPaymentProgressFailed=true; return; }
	  
	  if(data['result'] == 600) { showPaymentErrorState(e, "Maksukorttia ei pystytty varmentamaan virheellisesti sy&ouml;tetyn CVC-turvakoodin vuoksi."); jQuery("span#errorText3").html("Maksukorttia ei pystytty varmentamaan virheellisesti sy&ouml;tetyn CVC-turvakoodin vuoksi."); jQuery("span#loading").html(""); isPaymentProgressFailed=true; return; }
	  if(data['result'] == 601) { showPaymentErrorState(e, "Maksukorttia ei pystytty varmentamaan kortin k&auml;yt&ouml;n ev&auml;&auml;ntymisen vuoksi."); jQuery("span#errorText3").html("Maksukorttia ei pystytty varmentamaan kortin k&auml;yt&ouml;n ev&auml;&auml;ntymisen vuoksi."); jQuery("span#loading").html(""); isPaymentProgressFailed=true; return; }
	  if(data['result'] == 602) { showPaymentErrorState(e, "Maksukorttia ei pystytty varmentamaan kortin k&auml;yt&ouml;n ev&auml;&auml;ntymisen vuoksi."); jQuery("span#errorText3").html("Maksukorttia ei pystytty varmentamaan kortin k&auml;yt&ouml;n ev&auml;&auml;ntymisen vuoksi."); jQuery("span#loading").html(""); isPaymentProgressFailed=true; return; }
	  if(data['result'] == 603) { showPaymentErrorState(e, "Maksukorttia ei pystytty varmentamaan."); jQuery("span#errorText3").html("Maksukorttia ei pystytty varmentamaan."); jQuery("span#loading").html(""); isPaymentProgressFailed=true; return; }
	  if(data['result'] == 604) { showPaymentErrorState(e, "Maksukorttia ei pystytty varmentamaan. Maksukortillasi ei ole riitt&auml;v&auml;sti katetta."); jQuery("span#errorText3").html("Maksukorttia ei pystytty varmentamaan. Maksukortillasi ei ole riitt&auml;v&auml;sti katetta."); jQuery("span#loading").html(""); isPaymentProgressFailed=true; return; }
	  if(data['result'] == 605) { showPaymentErrorState(e, "Maksukorttia ei pystytty varmentamaan kortin k&auml;ytt&ouml;ajan umpeutumisen vuoksi."); jQuery("span#errorText3").html("Maksukorttia ei pystytty varmentamaan kortin k&auml;ytt&ouml;ajan umpeutumisen vuoksi."); jQuery("span#loading").html(""); isPaymentProgressFailed=true; return; }
	  if(data['result'] == 606) { showPaymentErrorState(e, "Maksukorttia ei pystytty varmentamaan virheellisesti sy&ouml;tettyjen tietojen vuoksi."); jQuery("span#errorText3").html("Maksukorttia ei pystytty varmentamaan virheellisesti sy&ouml;tettyjen tietojen vuoksi."); jQuery("span#loading").html(""); isPaymentProgressFailed=true; return; }
	  if(data['result'] == 607) { showPaymentErrorState(e, "Maksukorttia ei pystytty varmentamaan virheellisesti sy&ouml;tetyn postinumeron vuoksi."); jQuery("span#errorText3").html("Maksukorttia ei pystytty varmentamaan virheellisesti sy&ouml;tetyn postinumeron vuoksi."); jQuery("span#loading").html(""); isPaymentProgressFailed=true; return; }
	  if(data['result'] == 608) { showPaymentErrorState(e, "Maksukorttia ei pystytty varmentamaan kortin voimassaolo kuukauden vuoksi."); jQuery("span#errorText3").html("Maksukorttia ei pystytty varmentamaan kortin voimassaolo kuukauden vuoksi."); jQuery("span#loading").html(""); isPaymentProgressFailed=true; return; }
	  if(data['result'] == 609) { showPaymentErrorState(e, "Maksukorttia ei pystytty varmentamaan kortin voimassaolo vuoden vuoksi."); jQuery("span#errorText3").html("Maksukorttia ei pystytty varmentamaan kortin voimassaolo vuoden vuoksi."); jQuery("span#loading").html(""); isPaymentProgressFailed=true; return; }
	  
	  // Ohjataan asiakas maksusivustolle.
	  if(data['result'] == 1 && data['next_url'] != null && data['next_url'] != "") {
		jQuery("span#loading").html('Menn&auml;&auml;n pankin maksusivustolle.');
		setTimeout(function () {
		  var $form=jQuery(document.createElement('form')).css({display:'none'}).attr("method","POST").attr("action",data['next_url']);
		  var $input;
		  jQuery.each( data['parameters'], function( index, parameter ) {
			  console.log("parameter:"+parameter['name']+":"+parameter['value']);
			  $input=jQuery(document.createElement('input')).attr('name',parameter['name']).val(parameter['value']);
			  $form.append($input);
			  jQuery("body").append($form);
		  });
		  $form.submit();
		}, 1000);
		isChargePaymentProgress=true; return;
	  } else {
	    // Maksutoimenpide on onnistuneesti suoritettu. Näytetään kuittaussivusto.
	    jQuery("#frm_finish_payment").submit();
	    isChargePaymentProgress=true;
	  }
	}, 'json').fail(function() {
	  showPaymentErrorState(e); jQuery("span#errorText3").html("Maksukorttia ei pystytty varmentamaan. Maksamisen virhekoodi: 030."); jQuery("span#loading").html("");
	  isChargePaymentProgress=true; isPaymentProgressFailed=true; isPaymentRequestEnabled=false;
	});
}

// Tarkistetaan onko istunto vielä voimassa.
function checkIsSessionExpired() {
  if(!isSessionExpiredCheckEnabled) { return; }
  jQuery.post("../cgi-bin/index.cgi", {
	check_booking_no: true,
	booking_no: jQuery("span.booking_no").html()
  }, function( data ) {
	if(data == "failed") {
	  disableBooking();
	} else {
	  setTimeout(function () {
	    checkIsSessionExpired();
	  }, 20000);
	}
  }).fail(function() {
	disableBooking();
  });
}

// Disabloidaan varaus, koska istunto on vanhentunut.
function disableBooking() {
	jQuery("div#msglayer").css("visibility","visible");
	jQuery("input#btn_payment").attr("disabled", true);
	jQuery("input#btn_payment_not_register").attr("disabled", true);
	setTimeout(function () {
	  jQuery("div#session_expired_add_modal").modal('show');
	}, 500);
}

// Näytetään maksamisen virhetila.
function showPaymentErrorState(e, errorText) {
  if(errorText === undefined) { return; }
  
  jQuery('div.adbox').removeClass("adbox-border");
  jQuery('div.adbox').removeClass("adbox-border-error");
  jQuery(e).addClass("adbox-border-error");  
  jQuery(e).children("div.adbox-spinner").hide();
  jQuery(e).children("div.adbox-logo-wrap").css("opacity", "1");
  showAlertWarningAfter('div#'+jQuery(e).attr('id'), errorText);
}

// Onloadit.
jQuery(document).ready(function() {
  // Varauksen peruutus.
  jQuery("#cancel_reservation2").click(function() {
    window.onbeforeunload=null;
    isSessionExpiredCheckEnabled=false;
	
    if(document.location.host.indexOf('dev.') < 0 && document.location.host.indexOf('demo.') < 0) {
      ga('send', 'event', 'Varauksen peruutus, booking_no:'+jQuery("span.booking_no").html(), location.pathname);
    }
	
    jQuery.post('../cgi-bin/index.cgi', {
      delete_unverify_reservation: true,
      booking_no: jQuery("span.booking_no").html()
    }, function() {
      jQuery("form#frm_place_page").submit();
    });
  });
  // Mennään kirjautumiseen.
  jQuery("input#btn_login_page").click(function() {
    jQuery("#frm_login").submit();
  });
  // Päivitetään henkilötietoja.
  jQuery("#edit_personal_data").click(function() {
	window.onbeforeunload=null;
	editPersonalData(); return false;
  });
  
});

// Ladataan kohdesivu.
function loadPlaceLocation(id) {
  document.location = '/search/'+id+'/';
  return true;
}

// Näytä lataussymboli.
function showLoadingSymbol(e) {
  jQuery(e).children("div.adbox-spinner").show();
  jQuery(e).children("div.adbox-logo-wrap").css("opacity", "0.1");
}

function updateInputField(from_id, to_id) {
  jQuery(to_id).val(jQuery(from_id).val());
}

function editPersonalData() {
	if(jQuery("input#set_firstname").length > 0) { return; }
	
	var button_save_name = button_save_name_fin;
	if(getCookie('lang') == "en") {
	  button_save_name = button_save_name_en;
	}
	
	jQuery("span#errorText2").html("");
	var fields = {'lastname':'lastname','firstname':'firstname','address':'address','zipcode':'zipcode','city':'city','telno':'telno','email':'email'};
	var fvalue; var spantext; var requiredField;
	email_addr = jQuery("span#email").html(); isPersonalDataSaveProgress=false;
	for (var f in fields) {
	  if(jQuery("span#"+f) != null) {
		requiredField="";
		if(f == "email") { requiredField = ' disabled="true"'; }
		
		spantext = jQuery("span#"+f).html(); spantext = spantext.replace(new RegExp("[\&nbsp\;]+$","gm"),"");
		if(f != "lastname") { spantext = spantext.trim(); }
		fvalue = "<input type=\"text\" id=\"set_"+f+"\" name=\"set_"+f+"\" value=\""+spantext+"\" class=\"input_width-85\" style=\"z-index:50;\""+requiredField+" /><span class=\"\" style=\"color:green;\"></span>";
		jQuery("span#"+f).html(fvalue);
		jQuery("span#"+f).css("font-size","14px");
		// Dynaaminen näppäimistön eventin seuranta.
		jQuery("input#set_"+f).keypress(function(event) {
		  var c; document.all ? c = event.keyCode : c = event.which;
		  if(c == 13) { savePersonalData(); }
		  return c;
		});
		jQuery("input#set_"+f).blur(function() {
		  var fieldName = jQuery(this).attr('id');
		  fieldName = fieldName.replace(/set_/g, '');
		  checkInputFields(jQuery(this).attr('id'),fields[fieldName],'errorText2');
		});
	  }
	}
	if(detectMobile()) { jQuery("div#payment_userdata").css("height","560px");
	} else { jQuery("div#payment_userdata").css("height","400px"); }
	
	var button_html = "<div id=\"div_save_personal_data\" class=\"col-xs-12 col-md-12\"><input type=\"button\" id=\"btn_save_edit_personal_data\" name=\"btn_save_edit_personal_data\" class=\"btn\" value=\" "+button_save_name+" \" style=\"position:relative;left:-6px;top:0px;margin-top:3px;font-size:16px;\" /></div>";
	jQuery("div#div_edit_personal_data").after(button_html);
	
	// Yhteystietojen tallentaminen.
	jQuery("#btn_save_edit_personal_data").click(function() {
	  window.onbeforeunload=null;
	  savePersonalData();
	});
	return false;
}
function savePersonalData() {
	if(isPersonalDataSaveProgress) { return false; }
	jQuery("span#errorText3").html("");
	var fields = {'firstname':'firstname','lastname':'lastname','address':'address','zipcode':'zipcode','city':'city','telno':'telno','email':'email'};
	var fvalue; var rv;
	
	// Tarkistetaan henkilötieto-kentät.
	for (var f in fields) {
	  rv = checkInputFields('set_'+f,fields[f],'errorText2');
	  if(!rv) { return false; }
	}
	
	isPersonalDataSaveProgress=true;
	jQuery.post('/signed/', {
	  btn_save_edit_personal_data: true,
	  name: jQuery("input#set_lastname").val()+" "+jQuery("input#set_firstname").val(),
	  address: jQuery("input#set_address").val(),
	  zipcode: jQuery("input#set_zipcode").val(),
	  city: jQuery("input#set_city").val(),
	  telno: jQuery("input#set_telno").val(),
	  email: jQuery("input#set_email").val(),
	  prev_email: email_addr
	}, function(data) {
	  if(data != null && data.toString().indexOf('Tapahtui ohjelmistovirhe.') >= 0) {
		jQuery("span#errorText2").html("Tallennus ep&auml;onnistui.");
		jQuery("span#errorText2").next().removeClass("fas fa-check fa-lg text-dark-green");
		isPersonalDataSaveProgress=false; return false;
	  }
	  
	  jQuery("input#finish_email").val(jQuery("input#set_email").val());
	  jQuery("span#errorText2").html("");
	  
	  for (var f in fields) {
		if(jQuery("span#"+f) != null) {
		  updateInputField("input#set_"+f, "input#"+f);
		  fvalue = jQuery("input#set_"+f).val();
		  jQuery("span#"+f).html(fvalue);
		  jQuery("span#"+f).css("font-size","19px");
		}
	  }
	  jQuery("div.text_height").css("height","27px");
	  jQuery("div#payment_userdata").css("height","auto");
	  jQuery("div#div_save_personal_data").remove();
	  jQuery("span#errorText2").next().addClass("fas fa-check fa-lg text-dark-green");
	}).fail(function() {
	  jQuery("span#errorText2").html("Tallennus ep&auml;onnistui.");
	  jQuery("span#errorText2").next().removeClass("fas fa-check fa-lg text-dark-green"); isPersonalDataSaveProgress=false;
	});
}