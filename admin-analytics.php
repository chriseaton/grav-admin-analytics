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

class AdminAnalyticsPlugin extends Plugin {

    protected $route = 'analytics';

    /**
     * @return array
     */
    public static function getSubscribedEvents() {
        return [
            'onPluginsInitialized' => ['onPluginsInitialized', 0],
        ];
    }

    /**
     * Enable only if url matches the analytics route.
     */
    public function onPluginsInitialized() {
        if ($this->isAdmin() == false) {
            return;
        }
        $this->enable([
            'onTwigTemplatePaths' => ['onTwigTemplatePaths', 0],
            'onPageInitialized' => ['onPageInitialized', 0],
            'onAdminMenu' => ['onAdminMenu', 0],
        ]);
    }

    // Ensure the plugin templates path is available to twig.
    public function onTwigTemplatePaths() {
        $this->grav['twig']->twig_paths[] = __DIR__ . '/admin/templates';
    }

    // Load the analytics systems and handle pre-authentication.
    // Fires when the page is initialized.
    public function onPageInitialized() {
        $uri = $this->grav['uri'];
        if ($this->route && '/admin/' . $this->route == $uri->path()) {
            require_once(__DIR__ . '/vendor/autoload.php');
            require_once(__DIR__ . '/classes/ga.php');
            $jsonFile = $this->config->get('plugins.admin-analytics.ga.key_file');
            if ($jsonFile != null && count($jsonFile) > 0) {
                //set variables for twig
                $uri = $this->grav['uri'];
                $twig = $this->grav['twig'];
                $ga = new GA(array_values($jsonFile)[0]['path']);
                $twig->GAAuthToken = $ga->getAuthToken();
            } else {
                error_log(print_r('No GA service account JSON key file uploaded. Cannot load GA dashboard.', true));
            }
        }
    }

    // Add navigation link to the admin plugin sidebar.
    public function onAdminMenu() {
        $this->grav['twig']->plugins_hooked_nav['PLUGIN_ADMIN_ANALYTICS.MENU_TEXT'] = ['route' => $this->route, 'icon' => 'fa-bar-chart'];
    }

}