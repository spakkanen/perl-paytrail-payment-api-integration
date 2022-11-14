#!/bin/perl -w
#
# The client sends payment request to the Paytrail Payment API. 
#
# Copyright:            Copyright (c) 2022
# Company:		Kliffa Innovations Oy
#
# @author 		Saku Pakkanen, saku@kliffainnovations.com
#
# Created		2.11.2022
# Updated		2.11.2022
#
#------------------------------------------------------------------------------
# Use-määrittely.
#------------------------------------------------------------------------------

use strict;
use warnings;
use lib 'lib';

use Kliffa::Paytrail;

use CGI; my $cgi = new CGI;
use Digest::MD5 qw(md5_hex);
use JSON;
use POSIX;

#------------------------------------------------------------------------------
# BEGIN
#------------------------------------------------------------------------------

BEGIN {}

#------------------------------------------------------------------------------
# Main
#------------------------------------------------------------------------------

sub main
{
  binmode(STDOUT, ":utf8");
  
  my $iPaytrai = new Kliffa::Paytrail;
  
  if($ENV{REQUEST_METHOD} eq "POST") {
        ##################################################################
	# Create a new payment.
	##################################################################
	if(defined $cgi->param('create_charge')) {
	  print $cgi->header(
	    -type=>'application/json',
	    -status=> '200 OK',
	    -charset=> 'UTF-8',
	  );

	  my $carddata;
	  foreach my $key ($cgi->param()) {
		if(defined $key and $key ne "") { $carddata->{$key} = $cgi->param($key); }
	  }
	  print to_json($iPaytrai->create_charge($carddata));
	} else {
	  print $cgi->header(
	    -type=>'application/json',
	    -status=> '403 Forbidden',
	    -charset=> 'UTF-8',
	  );
      print "failed";
	}
	##################################################################
  } else {
	##################################################################
	# Check up payment status.
	##################################################################
	if(defined $cgi->param('payment_status') and defined $cgi->param('checkout-transaction-id')) {
	  print $cgi->header(
	    -type=>'application/json',
	    -status=> '200 OK',
	    -charset=> 'UTF-8',
	  );
	  my ($transaction_id,$payment_status) = $iPaytrai->get_payment_status($cgi->param('checkout-transaction-id'));
	  print qq|{"transaction_id":"$transaction_id", "status":"$payment_status"}|;
	} else {
      print $cgi->header(
	    -type=>'application/json',
	    -status=> '403 Forbidden',
	    -charset=> 'UTF-8',
	  );
	  print "failed";
	}
  }
  return 0;
}

#------------------------------------------------------------------------------
# END
#------------------------------------------------------------------------------

END {}

#------------------------------------------------------------------------------
# Entry point
#------------------------------------------------------------------------------

exit main(@ARGV);
