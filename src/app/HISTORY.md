App Framework Change History
============================

3.4.1
-----

* Controller: Added a workaround for an iOS 4 bug that causes the previous URL
  to be displayed in the location bar after calling `save()` or `replace()` with
  a new URL.

* Controller: Fixed a bug that caused the controller to get stuck in a
  "dispatching" state if `save()` was called with no routes defined.


3.4.0
-----

* Initial release.
