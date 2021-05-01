ruby_version_file = File.expand_path(".ruby-version", __dir__)
ruby File.read(ruby_version_file).chomp if File.readable?(ruby_version_file)
source "https://rubygems.org"

group :development do
  gem "rubocop", require: false
  gem "rubocop-rails", require: false
  gem "rubocop-rake", require: false
  gem "rubocop-rspec", require: false
end

group :development, :test do
  gem "capybara"
  gem "coveralls_reborn", require: false
  gem "faker"
  gem "pry-byebug"
  gem "rack-test"
  gem "rspec"
  gem "rspec-html-matchers"
  gem "shotgun"
  gem "simplecov"
  gem "timecop"
end

gem "activerecord"
gem "bcrypt"
gem "delayed_job"
gem "delayed_job_active_record"
gem "feedbag"
gem "feedjira"
gem "httparty"
gem "i18n"
gem "loofah"
gem "nokogiri"
gem "pg"
gem "puma"
gem "rack-protection"
gem "racksh"
gem "rack-ssl"
gem "rake"
gem "sass"
gem "sinatra"
gem "sinatra-activerecord"
gem "sinatra-contrib"
gem "sinatra-flash"
gem "sprockets"
gem "sprockets-helpers"
gem "thread"
gem "uglifier"
gem "will_paginate"
