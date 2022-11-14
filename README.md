# Paytrail Payment API with Perl code
This is integration how does build payment experiences using Perl code. We provide powerful and customizable UI screens and elements that can be used connects to the Paytrail REST API.

## Paytrail Payment API Demo

**You can see this demo app running in test mode on [kliffa-paytrail-api-demo.com](https://kliffa.fi/demo/perl-paytrail-payment-api-integration/en/create.html).**

## Requirements

Perl 5 or higher.

### Yum packages

libcurl perl-WWW-Curl perl-JSON

#### Installing yum packages

```sh
yum -y install libcurl perl-WWW-Curl perl-JSON
```

### Installing Perl modules

```sh
wget https://cpan.metacpan.org/authors/id/M/MI/MIK/CryptX-0.077.tar.gz
gzip -d CryptX-0.077.tar.gz
tar xvf CryptX-0.077.tar
cd CryptX-0.077
perl Makefile.PL
make
make install
```

## Paytrail initialization

To initialize Paytrail in your Perl code. Default payment credentials are test accounts.

`Paytrail.pm` file:

```sh
my $secret_key = "SAIPPUAKAUPPIAS";	# Paytrail secret key.
my $account_id = "375917";		# Paytrail Merchant ID.
```

## Usage

Calls own website page to `create.html` page.

## Read more

Read more Paytrail Payment REST API for https://docs.paytrail.com/#/?id=paytrail-payment-api

## Contributing

Contributions are welcome. Open an issue first before sending in a pull request. All pull requests review before they are merged to master.

## Contact

Please contact: saku@kliffa.fi .

## Workgroup

### Member

| Member Name |GitHub Alias|Company| Role |
| --- | --- | --- | --- |
| Saku Pakkanen | [@spakkanen] (https://github.com/spakkanen) | [Kliffa Innovations Oy] (https://kliffa.fi/en/) | Committer |



