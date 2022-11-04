# 
# Paytrail module.
#
# Copyright:	Copyright (c) 2022
# Company:		Kliffa Innovations Oy
#
# @author 		Saku Pakkanen, saku@kliffainnovations.com
#
# Created		2.11.2022
# Updated		4.11.2022
#
#------------------------------------------------------------------------------
# This package
#------------------------------------------------------------------------------

package Kliffa::Paytrail;

#------------------------------------------------------------------------------
# Use-määrittely.
#------------------------------------------------------------------------------

use strict;
use warnings;

use Crypt::Mac::HMAC qw( hmac_hex );
use DateTime;
use File::Path qw(mkpath);
use Fcntl qw/:flock/;
use JSON;
use HTTP::Response;
use WWW::Curl::Easy;
use HTTP::Request;
use POSIX;
use Sys::Hostname;

#------------------------------------------------------------------------------
# BEGIN
#------------------------------------------------------------------------------

my $url = "https://services.paytrail.com/";						# Paytrail URL address.
my $secret_key = "SAIPPUAKAUPPIAS";								# Paytrail secret key.
my $account_id = "375917";										# Paytrail Merchant ID.

my %payment_method_group = ("osuuspankki" => "bank", "nordea" => "bank", "danske" => "bank", "saastopankki" => "bank", "spankki" => "bank", 
"pop" => "bank", "aktia" => "bank", "handelsbanken" => "bank", "alandsbanken" => "bank", "omasp" => "bank", 
"visa" => "creditcard", "mastercard" => "creditcard", "amex" => "creditcard",
"mobilepay" => "mobile", "pivo" => "mobile", "siirto" => "mobile", "applepay" => "mobile");
my %payment_method_name = ("osuuspankki" => "OP", "nordea" => "Nordea", "danske" => "Danske Bank", "saastopankki" => "S\xc3\xa4\xc3\xa4st\xc3\xb6pankki", "spankki" => "S-pankki", 
"pop" => "POP Pankki", "aktia" => "Aktia", "handelsbanken" => "Handelsbanken", "alandsbanken" => "\xc3\x85landsbanken", "omasp" => "OmaSp", 
"visa" => "Visa", "mastercard" => "Mastercard", "amex" => "American Express",
"mobilepay" => "Mobiilimaksutavat", "pivo" => "Pivo", "siirto" => "Mobiilimaksutavat", "applepay" => "Mobiilimaksutavat");

my $create_payment_body = {};
$create_payment_body->{currency} = "EUR";
$create_payment_body->{language} = "FI";
$create_payment_body->{items}->[0]->{units} = 1;
$create_payment_body->{items}->[0]->{vatPercentage} = 24;
$create_payment_body->{deliveryAddress}->{country} = "FI";						# Country.

# ISO 8601 datetime.
my $dt = DateTime->now;
$dt->set_time_zone( 'Europe/Helsinki' );  

my $cut_off_times=0;

# Right price from database.
my $server_amount = 29900;

# Hostname.
#my $hostname = "https://kliffa.fi";
#my $hostname = $ENV{SERVER_NAME};
my $hostname = Sys::Hostname::hostname();

BEGIN {}

#------------------------------------------------------------------------------
# New
#------------------------------------------------------------------------------

=head1 METHODS

=cut
sub new {
    my $class = shift;
	my $self = {};
    bless($self, $class);
	return($self);
}

# Create a new payment.
sub create_charge {
  my $self = shift;
  my $carddata = shift;
  unless(defined $carddata) { return {"result" => 91}; }
  
  my $title = $carddata->{title};
  $title =~ s|&auml;|a|gs; $title =~ s|&ouml;|o|gs;
  my $title_fin = $carddata->{title};
  $title_fin =~ s|&auml;|Ä|gs; $title_fin =~ s|&ouml;|Ö|gs; $title_fin = uc($title_fin);	# Uppercases.
  if($title_fin =~ /^(.*?)\s*\//) { $title_fin=$1; }

  ########################################################################################
  # Remark! Remark! Remark! Remark! Remark!
  # Don't receive client price instead you have to get and check up right price from database.
  ########################################################################################
  #my $amount = ($carddata->{amount}+0);
  my $amount = ($server_amount+0);
  my $order_no = $carddata->{order_number};

  my $address = $carddata->{address}; $address =~ s|\s+$||gs; $address =~ s|&nbsp;||gs;
  my $zipcode = $carddata->{zipcode}; $zipcode =~ s|\s+$||gs; $zipcode =~ s|&nbsp;||gs;
  my $city = $carddata->{city}; $city =~ s|\s+$||gs; $city =~ s|&nbsp;||gs;
  my $email = $carddata->{email}; $email =~ s|\s+$||gs;
  my $telno = $carddata->{telno}; $telno =~ s|^0|\+358|gs; $telno =~ s|\s+||gs; $telno =~ s|&nbsp;||gs;
  
  my $stamp = $order_no."-".time();
  my $uid = lc($stamp);
  my $payment_method = $payment_method_group{$carddata->{paymentmethod}};
  my $payment_name = $payment_method_name{$carddata->{paymentmethod}};
  
  my ($req,$browser,$response,$content,$content_hash,$json_obj,$response_json,$provider,$parameter,$redirect_url,$full_response,$rv);
  
  # CGI path.
  my $req_uri = $ENV{REQUEST_URI};
  $req_uri =~ s|cgi-bin/.*$||gs;
  my $lang = "en";
  if($ENV{REQUEST_URI} =~ /\/fin\//) { $lang = "fin"; }
  
  # Redirect and callback.
  $redirect_url = "https://".$hostname.$req_uri;
  
  ########################################################################################
  # 1. Create a new payment to the Paytrail API.
  ########################################################################################
  $create_payment_body->{stamp} = $stamp;									
  $create_payment_body->{reference} = $order_no;							
  $create_payment_body->{amount} = $amount;									
  $create_payment_body->{items}->[0]->{unitPrice} = $amount;				
  $create_payment_body->{items}->[0]->{productCode} = $order_no;			
  $create_payment_body->{items}->[0]->{stamp} = $stamp;						
  $create_payment_body->{customer}->{email} = $email;						
  $create_payment_body->{customer}->{firstName} = $carddata->{firstname};	
  $create_payment_body->{customer}->{lastName} = $carddata->{lastname};		
  $create_payment_body->{customer}->{phone} = $telno;						
  $create_payment_body->{deliveryAddress}->{streetAddress} = $address;		
  $create_payment_body->{deliveryAddress}->{postalCode} = $zipcode;			
  $create_payment_body->{deliveryAddress}->{city} = $city;					
  $create_payment_body->{groups}->[0] = $payment_method;					
  $create_payment_body->{redirectUrls}->{success} = $redirect_url.$lang."/succeeded.html";
  $create_payment_body->{redirectUrls}->{cancel} = $redirect_url.$lang."/failed.html";
  $create_payment_body->{callbackUrls}->{success} = $redirect_url.$lang."/succeeded.html";
  $create_payment_body->{callbackUrls}->{cancel} = $redirect_url.$lang."/failed.html";
  
use Data::Dumper;
my $dumperfile = Dumper($create_payment_body);
warn "body:".$dumperfile;

  # The headers are:
  my @checkout_headers = (
    "checkout-account:".$account_id,								# Account ID.
    "checkout-algorithm:sha256",									# SHA256 algorithm.
    "checkout-method:POST",											# Name of method.
	"checkout-nonce:".$uid,											# Unique number.
	"checkout-timestamp:".$dt->strftime('%Y-%m-%dT%H:%M:%S.000Z')	# Timestamp.
  );
  
  my $signature = hmac_hex('SHA256', $secret_key, join("\n", @checkout_headers, encode_json($create_payment_body)));
  my @req_headers = @checkout_headers;
  push(@req_headers, "signature:".$signature);
  push(@req_headers, "Accept:application/json");
  push(@req_headers, "Content-Type:application/json; charset=utf-8");
  push(@req_headers, "Host:services.paytrail.com");
  push(@req_headers, "platform-name:commerce-kliffa");

  my $curl = WWW::Curl::Easy->new( { timeout => 30 } );
  $curl->setopt(CURLOPT_URL, $url.'payments');
  $curl->setopt(CURLOPT_HEADER, 1);
  $curl->setopt(CURLOPT_USERAGENT, "Kliffabot/0.1");
  $curl->setopt(CURLOPT_SSL_VERIFYPEER, 0);
  $curl->setopt(CURLOPT_WRITEDATA(),\$full_response);
  $curl->setopt(CURLOPT_POST, 1);
  $curl->setopt(CURLOPT_POSTFIELDS, encode_json($create_payment_body));
  $curl->pushopt(CURLOPT_HTTPHEADER, \@req_headers);
  
  # Starts the actual request.
  $rv = $curl->perform;
 
  my $status_code = -1;
  my $next_url=""; my $provider_parameters="";
 
  # Check received response.
  if($rv == 0) {
	my $response_code = $curl->getinfo(CURLINFO_HTTP_CODE);
	if($response_code == 200 or $response_code == 201) {
	  ###################################################################################
	  # Parse request.
	  ###################################################################################
	  $status_code = 1;
	  $content_hash = HTTP::Response->parse($full_response);
	  unless(defined $content_hash) {
		$self->log("Paytrail: create_charge: The request failed. booking_no:".$order_no.".", "ERROR");
		return {"result" => 100};
	  }
      $content = $content_hash->{'_content'};
warn "providers:".$content;
	  
	  unless(defined $content) {
		$self->log("Paytrail: create_charge: The request failed. booking_no:".$order_no.".", "ERROR");
		return {"result" => 100};
	  }
      if($content eq "") {
		$self->log("Paytrail: create_charge: The request failed. booking_no:".$order_no.".", "ERROR");
		return {"result" => 100};
	  }

	  $response_json = from_json($content);
	  $carddata->{pi_id} = $response_json->{transactionId};

	  # Fetch up right provider.
	  foreach(@{$response_json->{providers}}) {
		$provider = $_;

		if($provider->{name} eq $payment_name) {
		  # Tallennetaan tietokantaan kuitti maksusta.
		  $self->save_receipt($carddata);
		  # URL-osoite.
		  $next_url = $provider->{url};
		  $provider_parameters = $provider->{parameters};
		  last;
		}
	  }

	  if($next_url eq "") {
		$self->log("Paytrail: create_charge: The request failed. Provider is undefined. booking_no:".$order_no.".", "ERROR");
		return {"result" => 106};	# Provider is invalid.
	  }
	  ###################################################################################
	} else {
	  $status_code = 100;			# The request failed.
	  $self->log("Paytrail: create_charge: The request failed. booking_no:".$order_no.". Virhekoodi: '".$curl->errbuf."', response_code:".$response_code.".", "ERROR");
	}
  } else {
	$status_code = 100;				# The request failed.
	$self->log("Paytrail: create_charge: The request failed. booking_no:".$order_no.". Virhekoodi: '".$curl->errbuf."'.", "ERROR");
  }
  $self->log("Paytrail: create_charge: The request is successful. booking_no:".$order_no.", provider_name:".$payment_name.".", "INFO");
  
  my $resp_json={};
  $resp_json->{result} = $status_code;
  $resp_json->{next_url} = $next_url;
  $resp_json->{parameters} = $provider_parameters;
  $resp_json->{group} = $payment_method;
  return ($resp_json);
  
  return 1;
}

# Saves receipt to the database.
sub save_receipt {
  my $self = shift;
  my $carddata = shift;
  unless(defined $carddata) { return 100; }
  
  my ($rv, $paymentdata);
  
  # Tallennetaan transactionId-kenttä tietokannan pi_id-kenttään.
  $paymentdata->{booking_no} = $carddata->{order_number};
  $paymentdata->{pi_id} = $carddata->{pi_id};
	  
  ########################################################################################
  # Remark! Remark! Remark! Remark! Remark!
  # Here could be receipt's save to database.
  ########################################################################################
  
  return 1;
}

# Tarkistetaan maksun tila.
sub get_payment_status {
  my $self = shift;
  my $transaction_id = shift;
  unless(defined $transaction_id) { $self->log("Paytrail: get_payment_status: transaction_id is undefined.", "ERROR"); return undef; }
  
  my ($req,$browser,$response,$full_response,$content,$content_hash,$response_json,$rv);
  
  my $order_no = $self->_generate_booking_no();			# Generoidaan 20 merkkinen tunniste.
  my $uid = lc($order_no)."-".time();
  
  # Kirjautumisen headerit.
  my @checkout_headers = (
    "checkout-account:".$account_id,					# Tilin ID-numero.
    "checkout-algorithm:sha256",
    "checkout-method:GET",
	"checkout-nonce:".$uid,								# Uniikki numero.
	"checkout-timestamp:".$dt->strftime('%Y-%m-%dT%H:%M:%S.000Z'),		# Aikaleima.
	"checkout-transaction-id:".$transaction_id
  );
  
  my $signature = hmac_hex('SHA256', $secret_key, join("\n", @checkout_headers, ""));
  my @req_headers = @checkout_headers;
  push(@req_headers, "signature:".$signature);
  push(@req_headers, "Accept:application/json");
  push(@req_headers, "Content-Type:application/json; charset=utf-8");
  push(@req_headers, "Host:services.paytrail.com");
  push(@req_headers, "platform-name:commerce-kliffa");
  
  my $curl = WWW::Curl::Easy->new( { timeout => 30 } );
  $curl->setopt(CURLOPT_URL, $url.'payments/'.$transaction_id);
  $curl->setopt(CURLOPT_HEADER, 1);
  $curl->setopt(CURLOPT_SSL_VERIFYPEER, 0);
  $curl->setopt(CURLOPT_USERAGENT, "Kliffabot/0.1");
  $curl->setopt(CURLOPT_WRITEDATA,\$full_response);
  $curl->pushopt(CURLOPT_HTTPHEADER, \@req_headers);
  
  # Starts the actual request.
  $rv = $curl->perform;
 
  # Check received response.
  if($rv == 0) {
	my $response_code = $curl->getinfo(CURLINFO_HTTP_CODE);
	if($response_code == 200 or $response_code == 201) {
	  ###################################################################################
	  # Parse request.
	  ###################################################################################
	  $content_hash = HTTP::Response->parse($full_response);
	  unless(defined $content_hash) {
		$self->log("Paytrail: get_payment_status: The request failed. transaction_id:".$transaction_id.".", "ERROR");
		return undef;
	  }
      $content = $content_hash->{'_content'};
	  
	  unless(defined $content) {
		$self->log("Paytrail: get_payment_status: The request failed. transaction_id:".$transaction_id.".", "ERROR");
		return undef;
	  }
      if($content eq "") {
		$self->log("Paytrail: get_payment_status: The request failed. transaction_id:".$transaction_id.".", "ERROR");
		return undef;
	  }
	  $response_json = from_json($content);
	  
warn "paytrail_status:".$content;
	  # Tarkistetaan, että transaction_id on sama.
	  unless(defined $response_json->{transactionId}) {
		$self->log("Paytrail: get_payment_status: Paytrail transaction_id is wrong. transaction_id_db:".$transaction_id.", transaction_id_json:".$response_json->{transactionId}.".", "ERROR");
		return undef;
	  }
	  
	  if($response_json->{status} eq "ok" or $response_json->{status} eq "new") {
		$self->log("Paytrail: get_payment_status: The request is successful. transaction_id:".$transaction_id.", response_code:".$response_code.".", "INFO");
	    return ($transaction_id,"succeeded",undef);
	  } elsif($response_json->{status} eq "fail") {
		$self->log("Paytrail: get_payment_status: The request failed. transaction_id:".$transaction_id.", status:".$response_json->{status}.", response_code:".$response_code.".", "ERROR");
	    return ($transaction_id,"requires_payment_failed",undef);
	  } else {
		$self->log("Paytrail: get_payment_status: The request failed. Cut off times:".$cut_off_times.".  transaction_id:".$transaction_id.", status:".$response_json->{status}.", response_code:".$response_code.".", "ERROR");
		
		if(($cut_off_times+1) < 6) {
		  $cut_off_times++;
		  sleep 5;	
		  $self->get_payment_status($transaction_id);
		}
	    return ($transaction_id,"fail",undef);
	  }
	  ###################################################################################		
	} else {
	  $self->log("Paytrail: get_payment_status: The request failed. transaction_id:".$transaction_id.", response_code:".$response_code.".", "ERROR");
	}
  } else {
	$self->log("Paytrail: get_payment_status: The request failed. transaction_id:".$transaction_id.". Virhekoodi: '".$curl->errbuf."'.", "ERROR");
  }
  return undef;
}

sub _generate_booking_no {
	my $self = shift;
	###############################################################
	# Generate booking_no.
	###############################################################
	my $rand_no="";
	my $i=0;
	my @chars = ("A".."Z", "0".."9"); for(1..20) { $rand_no .= $chars[rand @chars]; if($i == 10) { $rand_no .= "-"; } $i++; }
	return $rand_no;
}

sub log {
  my $self = shift;
  my $text = shift;
  my $state = shift;

  warn $text." [".$state."]";
  return 1;
}

1;