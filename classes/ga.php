<?php
namespace Grav\Plugin\AdminAnalytics;

use Google\Auth\Credentials\ServiceAccountCredentials;

class GA {

    // Holds the path to the GA JSON service account key file.
    protected $jsonKeyFilePath = "";

    public function __construct($keyPath) {
        $this->jsonKeyFilePath = $keyPath;
    }

    // Returns an API authentication token for use with Google Analytics API calls..
    public function getAuthToken() {
        $sac = new ServiceAccountCredentials(['https://www.googleapis.com/auth/analytics.readonly'], $this->jsonKeyFilePath);
        $token = $sac->fetchAuthToken();
        return $token['access_token'];
    }

}
