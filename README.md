# TIBET v5.0.0

TIBET 5.0 is a server-agnostic, markup-driven, zero-reload web platform built to
make web application development more scalable, maintainable, and efficient.

### TIBET 5.0 is server-agnostic.
TIBET 5.0 is server-agnostic to the point of being able to run without a
server of any kind. With TIBET you can use any server technology you
desire, or build applications that run directly from the desktop or
device with no server. Full-stack multi-tier TIBET applications are also
supported via an optional Node.js-based TIBET server which allows
properly modularized code to migrate between client and server.

### TIBET 5.0 is markup-driven.
Tags are a central organizing principle for functionality in TIBET. In TIBET,
tags are smart macros, macros you can create, combine, and script together to
create applications of any scope and complexity without sacrificing reuse.
TIBET's tag library and our TIBET Tag Store&trade; ecosystem give you access to
a broad set of reusable functionality in the form of intelligent tag bundles.

### TIBET 5.0 is zero-reload.
The entire TIBET platform, from our tag set to our IDE, has been engineered to
eliminate reload cycles. With TIBET you develop _live_, while your application
runs. Changes you make to your JavaScript, HTML, and CSS are reflected instantly
and persisted or rolled back at your discretion.

# Installation

TIBET leverages Node.js for all of its command-line utilities. *Node.js is _not
required_ for production or as a server technology.* We simply find that, as a
JavaScript technology, TIBET's helper scripts benefit from the cross-platform
foundation Node.js provides. 

1. Install Node.js version 0.8 or greater from http://nodejs.org/

2. Install TIBET globally using the `npm` command:

    npm install -g tibet

# Quick Start

Once you've installed the TIBET platform you utilize the `tibet` command to
assist with application creation, configuration, testing, and deployment. You
can get help on your options at any time by issuing the help command:

    tibet help

### TIBET Server

While the TIBET platform is server-agnostic we recognize that sometimes it's
desireable to have a complete full-stack solution from a single vendor. That's
where the TIBET Server comes in. Create a full-stack TIBET application using:

    tibet clone tibet {path}

This command will clone a TIBET client+server application template you can run
from within your newly created application {path} via:

    cd {path}
    npm start

### Node.js Server

If you'd like to use a non-TIBET Node.js server platform as the foundation for
your application you can use:

    tibet clone nodejs {path}

This command will create a simple node.js application based on 'connect' to get
you started. You can run your new application immediately using:

    cd {path}
    npm start

If you'd like to use a different server framework such as Express you can update
the package.json and server.js files to launch the framework of your choice.

### Ruby-On-Rails Server

For Ruby-on-Rails servers invoke:

    tibet clone rails {path}

TIBET includes a Rails 3.x REST-driven application template. The presumption
here is that you want TIBET doing most of the UI and interaction work while you
let Rails manage data access and data transport at the services layer.

### CouchDB Server

TIBET can leverage CouchDB as a server, running your application as a CouchApp.
To create an application of this form make sure your CouchDB server is running
and then invoke:

    tibet clone couch {path} {couch-url}

You need to provide TIBET with the URL to your CouchDB server so it can install
properly into your database. Once the installation has completed you can access
the application's URL to launch your new TIBET-enabled CouchApp.

### Other Server(s)

For most web server technologies you can simply link TIBET into your application
directory and add a reference to `tibet.js` to your index.html. Linking TIBET in
this fashion will create a symbolic link to the currently installed global
version of TIBET.

    tibet link .

Linking TIBET is a great option during development, but for production
deployment, or to use a different version of TIBET with different applications,
you may want to 'freeze' a version of TIBET in your application's directory.

    tibet freeze [@version] .

### Zero-Server

TIBET's micro-kernel (tibet.js) supports launching applications directly from
the file system without a server of any kind. To create a TIBET application of
this form use:

    tibet clone noserver {path}

TIBET will create a new directory containing a simple application whose entry
point is the index.html file at the top of the directory tree. You can open this
file from the command line or by navigating to it from a modern web browser to
launch your standalone TIBET application.

    open index.html 

OR, in a browser:

    file://{path}/index.html

##### File-based Security 

NOTE that some browsers have security constraints which may interfere with
launching from the file system. Depending on your deployment requirements you
can choose to configure your browser to allow file-system launching, install
your application as a browser extension (not available for Safari), or use an
HTTP server to bootstrap your application into the browser where it can then
run offline.

##### Http-based Bootstrap

If you're uncomfortable launching directly from the file system you can still
build applications that are pure client, you just need to launch the initial
index.html file from a web server, let TIBET load itself into your browser once,
and from that point on you can run your application as if you're offline.
TIBET is fully capable of running without communicating with a server to launch.

# Documentation

The GitHub-based [TIBET wiki](https://github.com/TechnicalPursuit/TIBET/wiki)
is a great place to get started. Documentation in the TIBET wiki is focused on
TIBET's overall architecture, construction standards, and project roadmap.

Full product documentation is hosted at <http://www.technicalpursuit.com>.

# The Tag Store&trade;

TIBET tags are self-contained packages of web functionality you can create,
share, and leverage in the construction of your applications. The TIBET Tag
Store&trade; is our hosted clearinghouse for tags and other TIBET-related
products and services.

Visit the TIBET Tag Store&trade; at <http://www.technicalpursuit.com/tibet/tagstore/>.

# Contacting Us

The best way to communicate an issue, feature request, or code-related concern
is to use the GitHub issues list. We monitor this list actively and try to
leverage it to keep all discussion regarding TIBET centralized on GitHub.

If you have specific code you'd like us to consider we're always open to [pull
requests](http://help.github.com/articles/using-pull-requests). Using pull
requests is great way to keep discussion of new features visible to the entire
TIBET community.

Additional contact info is available at <http://www.technicalpursuit.com>. 

