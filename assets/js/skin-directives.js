import angular from 'angular';

const skin = angular.module('app.skinDirectives', []);

skin.directive('designPanel', () => {
  return {
    restrict: 'E',
    templateUrl: '/partials/design-panel.html',
    require: '^MainController'
  }
});

skin.directive('applicationView', () => {
  return {
    restrict: 'E',
    templateUrl: '/partials/application-view.html',
    transclude: true
  }
});

skin.directive('pageListNav', ($translate, $modal, $state,
                               app, appName, config, globalConfig, confirm) => {
  // TODO: synchronize css styles on active link after clicking
  return {
    restrict: 'E',
    templateUrl: '/partials/page-list-nav.html',
    link(scope) {
      angular.extend(scope, {
        appName,
        config,

        openPageConfig(page) {
          const thisPage = app.pageConfig().href === page.href;
          $modal.open({
            templateUrl: '/partials/page-modal-config.html',
            controller: 'PageSettingsModalController',
            backdrop: 'static',
            resolve: {
              page: () => page
            }
          }).result
            .then(() => {
              app.markModified(true);
              if (thisPage) {
                $state.go('page', {href: page.href}, {reload: true});
              }
            });
        },

        deletePageWithConfirmation(page) {
          $translate('ARE_YOU_SURE_DELETE_PAGE')
            .then(confirm)
            .then((/*ok*/) => app.deletePage(page))
        }
      });
    }
  }
});

skin.directive('languageSelectorNav', ($translate) => {
  return {
    restrict: 'E',
    templateUrl: '/partials/language-selector-nav.html',
    scope: {
      "showFlags": "="
    },
    link(scope) {
      angular.extend(scope, {
        selectLanguage(langKey) {
          $translate.use(langKey);
        },
        languages: [
          {key: "en", title: "English"},
          {key: "uk", title: "Українська"},
          {key: "ru", title: "Русский"}
        ]
      });
    }
  }
});

skin.directive('logoutButton', () => {
  return {
    restrict: 'E',
    templateUrl: '/partials/logout-button.html'
  }
});

skin.directive('loginGoogleButton', () => {
  return {
    restrict: 'E',
    templateUrl: '/partials/login-google-button.html'
  }
});
