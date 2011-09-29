class WebsiteNavItem < ActiveRecord::Base
  belongs_to :website_nav
  belongs_to :linked_to_item, :polymorphic => true

  acts_as_nested_set if ActiveRecord::Base.connection.tables.include?('website_nav_items') #better nested set tries to use this before the table is there...

  def menu_url
    link = nil

    if linked_to_item.nil?
      link = url
    else
      link = "/"+linked_to_item.permalink.to_s
    end

    link
  end

  def positioned_children
    children.sort_by{|child| [child.position]}
  end

  def website_nav
    website_nav_id.nil? ? self.parent.website_nav : WebsiteNav.find(website_nav_id)
  end

end
