TIBET v5.0.0
============

TIBET - a markup-centric, zero-reload, full-stack web platform. Plus tools :)

<http://www.technicalpursuit.com/tibet>

Overview
--------

TIBET 5.0 is a markup-centric, zero-reload, full-stack web platform built to
solve the unspoken problem in building enterprise web applications and scaling
enterprise web development -- a limited and expensive pool of enterprise-class
JavaScript developers.

Let's break that down...

TIBET 5.0 is markup-centric. Your development efforts focus on creating,
combining, and configuring tags. TIBET's tag library, and our Tag Store&trade;
ecosystem, give you access to an ever-increasing library of reusable
functionality in markup form.

TIBET 5.0 is zero-reload. TIBET's client and server are engineered to ultimately
eliminate costly server restart and client reload cycles. With TIBET you develop
live while your application is running. All of TIBET is hot-reload ready.

TIBET 5.0 is full-stack. TIBET's fully-independent client and server model lets
you leverage the TIBET server, your existing server components, or no server at
all. The TIBET client is server-agnostic and can be run offline or not at all.

Installation
------------

The TIBET platform is available as a single NPM package installed via:

    npm install -g tibet

Once you've installed the TIBET platform you utilize the `tibet` command to
perform your application creation, configuration, testing, and deployment.

Use the `tibet help` command to view documentation on the `tibet` command
supplied with your release.

    tibet help

Quick Start
-----------

To create your first TIBET application you use the `tibet` command's `clone`
operation. You can clone any application with this approach, but you'll
typically use one of the templates provided with your TIBET release.

### Client-Server App

In the following example we'll create a new application with both a client and
server component by cloning TIBET's client-server application template:

    tibet clone client-server hello-full

With an application clone in place you can now move into the hello-full
directory and start your application's server:

    cd hello-full
    tibet server start

Open the server's default index.html page and you're up and running:
    
    http://localhost:9313/index.html

See the TIBET documentation for more information on how to take your next step.

### Server-Only App

You can also create server-only applications by cloning a server-only template:

    tibet clone server hello-server

The rest of your steps remain the same however no TIBET client code will be
loaded with this template, just a standard HTML page containing the template's
default HTML content:

    cd hello-server
    tibet server start
    http://localhost:9313/index.html

See the TIBET documentation for more information on how to take your next step.

### Client-Only App

Finally, you can use TIBET without a server with a little extra configuration.
We won't go into the details here but, if you know your browser is configured
to load JavaScript applications from the file system, you can use the following
steps to create a zero-server TIBET application and start it:

    tibet clone client hello-client
    cd hello-client
    open index.html 

See the TIBET documentation for more information on how to take your next step.

Documentation
-------------

The GitHub-based [TIBET wiki](https://github.com/TechnicalPursuit/TIBET/wiki)
is a great place to get started. Documentation in the TIBET wiki is focused on
topics of particular interest to developers who will be using TIBET via GitHub
or who want to learn more about TIBET's overall architecture, construction
standards, and project roadmap.

Full product documentation is hosted at <http://www.technicalpursuit.com/tibet>.

The Tag Store&trade;
--------------------

TIBET tags are self-contained packages of web functionality you can create,
share, and leverage in the construction of your applications. The TIBET Tag
Store is our hosted clearinghouse for tags and other TIBET-related products
and services.

TIBET's core tags are available free of charge from the Tag Store. Additional
tags from both Team TIBET&trade; and other TIBET developers are also offered.

Visit the TIBET Tag Store at <http://www.technicalpursuit.com/tibet/tagstore/>

