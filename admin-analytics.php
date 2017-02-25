<?php

namespace Grav\Plugin;
use Grav\Common\GPM\GPM;
use Grav\Common\Grav;
use Grav\Common\Page\Page;
use Grav\Common\Page\Pages;
use Grav\Common\Plugin;
use Grav\Common\Uri;
use RocketTheme\Toolbox\File\File;
use RocketTheme\Toolbox\Event\Event;
use RocketTheme\Toolbox\Session\Session;
use Symfony\Component\Yaml\Yaml as YamlParser;
use Grav\Plugin\AdminAnalytics\GA;
use Google\Auth\Credentials\ServiceAccountCredentials;

class AdminAnalyticsPlugin extends Plugin
{
    protected $route = 'analytics';
    /**
     * @return array
     */
    public static function getSubscribedEvents()
    {
        return [
            'onPluginsInitialized' => ['onPluginsInitialized', 0],
        ];
    }

    /**
     * Enable only if url matches to the configuration.
     */
    public function onPluginsInitialized()
    {
        if (!$this->isAdmin()) {
            return;
        }
        require_once __DIR__ . '/vendor/autoload.php';
        require_once(__DIR__ . '/classes/ga.php');
        /** @var Uri $uri */
        $uri = $this->grav['uri'];
        $this->enable([
            'onTwigTemplatePaths' => ['onTwigTemplatePaths', 0],
            'onAdminMenu' => ['onAdminMenu', 0],
        ]);
        $jsonFile = $this->config->get('plugins.admin-analytics.ga.key_file');
        if ($jsonFile != null && count($jsonFile) > 0) {
            $jsonFilePath = array_values($jsonFile)[0]['path'];
            //$test = new GA($jsonFilePath);
            $sac = new ServiceAccountCredentials(['https://www.googleapis.com/auth/analytics.readonly'], $jsonFilePath);
            $token = $sac->fetchAuthToken();
            //set variables for twig
            $uri = $this->grav['uri'];
            $twig = $this->grav['twig'];
            $twig->GAAuthToken = $token['access_token'];
            //error_log(print_r($twig->GAAuthToken, true));
        } else {
            error_log(print_r('No JSON key file configured.', true));
        }
    }

    /**
     * Add plugin templates path
     */
    public function onTwigTemplatePaths()
    {
        $this->grav['twig']->twig_paths[] = __DIR__ . '/admin/templates';
    }

    /**
     * Add navigation item to the admin plugin
     */
    public function onAdminMenu()
    {
        $this->grav['twig']->plugins_hooked_nav['PLUGIN_ADMIN_ANALYTICS.MENU_TEXT'] = ['route' => $this->route, 'icon' => 'fa-bar-chart'];
    }
}